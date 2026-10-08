"""Daily cost tracker and spend cap enforcement module."""

from abc import ABC, abstractmethod
from datetime import datetime, timedelta, timezone, date
from typing import Optional
from app.config import Settings, get_settings
from app.logging_config import logger

# Indian Standard Time (IST) fixed offset UTC+05:30
IST = timezone(timedelta(hours=5, minutes=30))


class SpendCapExceeded(Exception):
    """Exception raised when daily spend cap limit is reached."""

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class CostTracker(ABC):
    """Abstract cost tracker interface for future Redis backing."""

    @abstractmethod
    async def check_cap(self, settings: Optional[Settings] = None) -> None:
        """Check if daily spend cap is reached.

        Raises:
            SpendCapExceeded: If daily spend cap is reached or exceeded.
        """
        pass

    @abstractmethod
    async def record_usage(
        self, input_tokens: int, output_tokens: int, settings: Optional[Settings] = None
    ) -> float:
        """Record token counts, compute cost, update daily running total, and return turn cost."""
        pass

    @abstractmethod
    async def get_daily_total(self) -> float:
        """Return total spend in USD for today (IST)."""
        pass

    @abstractmethod
    async def reset(self) -> None:
        """Reset cost tracker state."""
        pass


class InMemoryCostTracker(CostTracker):
    """In-memory cost tracker tracking daily token spend in IST with midnight reset."""

    def __init__(self) -> None:
        now_ist = datetime.now(IST)
        self.current_date: date = now_ist.date()
        self.daily_total_usd: float = 0.0
        self.warning_logged: bool = False

    def _reset_if_new_day(self) -> None:
        """Reset spend metrics at midnight IST."""
        now_date = datetime.now(IST).date()
        if now_date != self.current_date:
            self.current_date = now_date
            self.daily_total_usd = 0.0
            self.warning_logged = False

    async def check_cap(self, settings: Optional[Settings] = None) -> None:
        """Check if current spend has reached daily spend cap."""
        if settings is None:
            settings = get_settings()

        self._reset_if_new_day()

        if self.daily_total_usd >= settings.DAILY_SPEND_CAP_USD:
            if not self.warning_logged:
                logger.warning(
                    f"Daily spend cap of ${settings.DAILY_SPEND_CAP_USD:.2f} USD exceeded! "
                    f"Current daily total: ${self.daily_total_usd:.4f} USD."
                )
                self.warning_logged = True
            raise SpendCapExceeded(
                "The chatbot daily usage limit has been reached. "
                "Please visit our Contact page to get in touch with us."
            )

    async def record_usage(
        self, input_tokens: int, output_tokens: int, settings: Optional[Settings] = None
    ) -> float:
        """Calculate LLM call cost, increment daily total, and check cap warning."""
        if settings is None:
            settings = get_settings()

        self._reset_if_new_day()

        cost = (
            (input_tokens / 1_000_000.0) * settings.MODEL_INPUT_PRICE_PER_M
            + (output_tokens / 1_000_000.0) * settings.MODEL_OUTPUT_PRICE_PER_M
        )
        self.daily_total_usd += cost

        if self.daily_total_usd >= settings.DAILY_SPEND_CAP_USD and not self.warning_logged:
            logger.warning(
                f"Daily spend cap of ${settings.DAILY_SPEND_CAP_USD:.2f} USD exceeded! "
                f"Current daily total: ${self.daily_total_usd:.4f} USD."
            )
            self.warning_logged = True

        return cost

    async def get_daily_total(self) -> float:
        """Return current daily spend total in USD."""
        self._reset_if_new_day()
        return self.daily_total_usd

    async def reset(self) -> None:
        """Reset tracking state for testing or admin operations."""
        self.current_date = datetime.now(IST).date()
        self.daily_total_usd = 0.0
        self.warning_logged = False


# Default singleton instance
default_cost_tracker = InMemoryCostTracker()
