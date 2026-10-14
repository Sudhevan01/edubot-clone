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
        self,
        input_tokens: int,
        output_tokens: int,
        settings: Optional[Settings] = None,
        session_id: Optional[str] = None,
    ) -> float:
        """Record token counts, compute cost, update daily and session totals, and return turn cost."""
        pass

    @abstractmethod
    async def get_daily_total(self) -> float:
        """Return total spend in USD for today (IST)."""
        pass

    @abstractmethod
    async def get_metrics(
        self, session_id: Optional[str] = None, settings: Optional[Settings] = None
    ) -> dict:
        """Return comprehensive live metrics for Swagger and monitoring."""
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
        self.daily_input_tokens: int = 0
        self.daily_output_tokens: int = 0
        self.daily_total_tokens: int = 0
        self.daily_request_count: int = 0
        self.session_usage: dict[str, dict] = {}
        self.latest_session_id: Optional[str] = None
        self.warning_logged: bool = False

    def _reset_if_new_day(self) -> None:
        """Reset spend metrics at midnight IST."""
        now_date = datetime.now(IST).date()
        if now_date != self.current_date:
            self.current_date = now_date
            self.daily_total_usd = 0.0
            self.daily_input_tokens = 0
            self.daily_output_tokens = 0
            self.daily_total_tokens = 0
            self.daily_request_count = 0
            self.session_usage = {}
            self.latest_session_id = None
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
        self,
        input_tokens: int,
        output_tokens: int,
        settings: Optional[Settings] = None,
        session_id: Optional[str] = None,
    ) -> float:
        """Calculate LLM call cost, increment daily total, update session tokens, and check cap warning."""
        if settings is None:
            settings = get_settings()

        self._reset_if_new_day()

        cost = (
            (input_tokens / 1_000_000.0) * settings.MODEL_INPUT_PRICE_PER_M
            + (output_tokens / 1_000_000.0) * settings.MODEL_OUTPUT_PRICE_PER_M
        )
        self.daily_total_usd += cost
        self.daily_input_tokens += input_tokens
        self.daily_output_tokens += output_tokens
        self.daily_total_tokens += (input_tokens + output_tokens)
        self.daily_request_count += 1

        if session_id:
            self.latest_session_id = session_id
            if session_id not in self.session_usage:
                self.session_usage[session_id] = {
                    "session_id": session_id,
                    "input_tokens": 0,
                    "output_tokens": 0,
                    "total_tokens": 0,
                    "turn_count": 0,
                    "cost_usd": 0.0,
                }
            s = self.session_usage[session_id]
            s["input_tokens"] += input_tokens
            s["output_tokens"] += output_tokens
            s["total_tokens"] += (input_tokens + output_tokens)
            s["turn_count"] += 1
            s["cost_usd"] += cost

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

    async def get_metrics(
        self, session_id: Optional[str] = None, settings: Optional[Settings] = None
    ) -> dict:
        """Return comprehensive live metrics for Swagger and monitoring."""
        if settings is None:
            settings = get_settings()

        self._reset_if_new_day()

        cap = settings.DAILY_SPEND_CAP_USD
        spent = self.daily_total_usd
        pending = max(0.0, cap - spent)
        percent = (spent / cap * 100.0) if cap > 0 else 0.0

        # Clean session_id (treat empty strings or whitespace as None)
        clean_sid = session_id.strip() if session_id and session_id.strip() else None

        # Resolve session: use specific session if valid, otherwise auto-fallback to latest active session
        target_sid = None
        if clean_sid and clean_sid in self.session_usage:
            target_sid = clean_sid
        else:
            target_sid = self.latest_session_id

        session_stats = None
        if target_sid and target_sid in self.session_usage:
            raw = self.session_usage[target_sid]
            max_sess = settings.RATE_LIMIT_SESSION_MAX
            remaining_turns = max(0, max_sess - raw["turn_count"])
            session_stats = {
                "session_id": target_sid,
                "messages_count": raw["turn_count"],
                "remaining_messages_allowed": remaining_turns,
                "input_tokens": raw["input_tokens"],
                "output_tokens": raw["output_tokens"],
                "total_tokens": raw["total_tokens"],
                "session_cost_usd": round(raw["cost_usd"], 6),
            }

        return {
            "date": f"{self.current_date.isoformat()} (IST)",
            "status": "cap_exceeded" if spent >= cap else "ok",
            "total_requests": self.daily_request_count,
            "total_tokens_used": self.daily_total_tokens,
            "total_input_tokens": self.daily_input_tokens,
            "total_output_tokens": self.daily_output_tokens,
            "total_spent_usd": round(spent, 6),
            "daily_budget_cap_usd": round(cap, 2),
            "pending_budget_usd": round(pending, 6),
            "budget_used_percentage": f"{percent:.2f}%",
            "is_cap_exceeded": spent >= cap,
            "pricing": {
                "input_per_million_usd": settings.MODEL_INPUT_PRICE_PER_M,
                "output_per_million_usd": settings.MODEL_OUTPUT_PRICE_PER_M,
            },
            "current_session": session_stats,
            "active_sessions_count": len(self.session_usage),
            "active_session_ids": list(self.session_usage.keys()),
        }

    async def reset(self) -> None:
        """Reset tracking state for testing or admin operations."""
        self.current_date = datetime.now(IST).date()
        self.daily_total_usd = 0.0
        self.daily_input_tokens = 0
        self.daily_output_tokens = 0
        self.daily_total_tokens = 0
        self.daily_request_count = 0
        self.session_usage = {}
        self.latest_session_id = None
        self.warning_logged = False


# Default singleton instance
default_cost_tracker = InMemoryCostTracker()
