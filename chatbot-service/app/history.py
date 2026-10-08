"""Conversation history store interface and in-memory implementation."""

from abc import ABC, abstractmethod
from datetime import datetime, timedelta, timezone
from typing import Dict, List, TypedDict
from app.llm.base import LLMMessage


class SessionData(TypedDict):
    """Internal session storage container."""

    messages: List[LLMMessage]
    last_accessed: datetime


class HistoryStore(ABC):
    """Abstract interface for session history storage."""

    @abstractmethod
    async def get_history(self, session_id: str) -> List[LLMMessage]:
        """Retrieve recent conversation history for a session."""
        pass

    @abstractmethod
    async def add_turn(
        self, session_id: str, user_message: str, assistant_message: str
    ) -> None:
        """Add user and assistant messages turn to session history."""
        pass

    @abstractmethod
    async def clear(self, session_id: str) -> None:
        """Clear session history."""
        pass


class InMemoryHistoryStore(HistoryStore):
    """In-memory session history store with sliding window and TTL expiration."""

    def __init__(
        self, max_messages: int = 6, ttl_minutes: int = 30
    ) -> None:
        """Initialize in-memory store with max messages and TTL in minutes."""
        self._store: Dict[str, SessionData] = {}
        self.max_messages = max_messages
        self.ttl = timedelta(minutes=ttl_minutes)

    def _cleanup_if_expired(self, session_id: str, now: datetime) -> bool:
        """Remove session if inactive for longer than TTL."""
        session = self._store.get(session_id)
        if session:
            if now - session["last_accessed"] > self.ttl:
                del self._store[session_id]
                return True
        return False

    async def get_history(self, session_id: str) -> List[LLMMessage]:
        """Get non-expired messages for session_id."""
        now = datetime.now(timezone.utc)
        if self._cleanup_if_expired(session_id, now):
            return []

        session = self._store.get(session_id)
        if not session:
            return []

        session["last_accessed"] = now
        return list(session["messages"])

    async def add_turn(
        self, session_id: str, user_message: str, assistant_message: str
    ) -> None:
        """Append user and assistant turn, trim to max_messages, and update TTL."""
        now = datetime.now(timezone.utc)
        self._cleanup_if_expired(session_id, now)

        if session_id not in self._store:
            self._store[session_id] = {
                "messages": [],
                "last_accessed": now,
            }

        session = self._store[session_id]
        session["messages"].append(LLMMessage(role="user", content=user_message))
        session["messages"].append(
            LLMMessage(role="assistant", content=assistant_message)
        )

        # Retain only the last max_messages
        if len(session["messages"]) > self.max_messages:
            session["messages"] = session["messages"][-self.max_messages :]

        session["last_accessed"] = now

    async def clear(self, session_id: str) -> None:
        """Clear specified session history."""
        if session_id in self._store:
            del self._store[session_id]


# Default singleton in-memory history instance
default_history_store = InMemoryHistoryStore()
