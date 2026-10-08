"""Rate limiting interface and in-memory implementation."""

from abc import ABC, abstractmethod
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional
from fastapi import Request

from app.config import Settings, get_settings


class RateLimitExceeded(Exception):
    """Exception raised when rate limit or session limit is exceeded."""

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


def get_client_ip(request: Request, trust_proxy: bool = False) -> str:
    """Extract real client IP address.

    Only trusts X-Forwarded-For header when trust_proxy is True.
    """
    if trust_proxy:
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            first_ip = forwarded.split(",")[0].strip()
            if first_ip:
                return first_ip

    if request.client and request.client.host:
        return request.client.host

    return "127.0.0.1"


class RateLimiter(ABC):
    """Abstract rate limiter interface for future Redis backing."""

    @abstractmethod
    async def check_and_increment(
        self, ip: str, session_id: str, settings: Optional[Settings] = None
    ) -> None:
        """Check limits for IP and session_id. Increment counts if allowed.

        Raises:
            RateLimitExceeded: If any limit is exceeded.
        """
        pass

    @abstractmethod
    async def clear() -> None:
        """Clear all stored rate limit records."""
        pass


class InMemoryRateLimiter(RateLimiter):
    """In-memory rate limiter enforcing per-IP and per-session limits."""

    def __init__(self) -> None:
        self._ip_minute: Dict[str, List[datetime]] = {}
        self._ip_day: Dict[str, List[datetime]] = {}
        self._session_counts: Dict[str, int] = {}

    async def check_and_increment(
        self, ip: str, session_id: str, settings: Optional[Settings] = None
    ) -> None:
        if settings is None:
            settings = get_settings()

        # Bypass rate limits when APP_ENV=test
        if settings.APP_ENV == "test":
            return

        now = datetime.now(timezone.utc)
        one_min_ago = now - timedelta(minutes=1)
        one_day_ago = now - timedelta(days=1)

        # Clean old timestamps for IP
        minute_history = [
            t for t in self._ip_minute.get(ip, []) if t > one_min_ago
        ]
        day_history = [
            t for t in self._ip_day.get(ip, []) if t > one_day_ago
        ]

        self._ip_minute[ip] = minute_history
        self._ip_day[ip] = day_history

        # 1. Check Session Limit
        session_msg_count = self._session_counts.get(session_id, 0)
        if session_msg_count >= settings.RATE_LIMIT_SESSION_MAX:
            raise RateLimitExceeded(
                f"This chat session has reached its maximum limit of {settings.RATE_LIMIT_SESSION_MAX} messages."
            )

        # 2. Check IP Per-Minute Limit
        if len(minute_history) >= settings.RATE_LIMIT_IP_PER_MINUTE:
            raise RateLimitExceeded(
                "Rate limit exceeded: maximum 10 requests per minute allowed. Please wait a moment."
            )

        # 3. Check IP Per-Day Limit
        if len(day_history) >= settings.RATE_LIMIT_IP_PER_DAY:
            raise RateLimitExceeded(
                "Daily request limit exceeded for your IP address. Please try again tomorrow."
            )

        # All checks passed: record request
        self._ip_minute[ip].append(now)
        self._ip_day[ip].append(now)
        self._session_counts[session_id] = session_msg_count + 1

    async def clear(self) -> None:
        """Clear all stored tracking records."""
        self._ip_minute.clear()
        self._ip_day.clear()
        self._session_counts.clear()


# Default singleton instance
default_rate_limiter = InMemoryRateLimiter()
