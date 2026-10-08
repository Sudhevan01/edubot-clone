"""Abstract LLM client interface and data models."""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional


@dataclass
class LLMMessage:
    """Represents a single message in a conversation history."""

    role: str  # "user" or "assistant"
    content: str


@dataclass
class LLMResponse:
    """Structured response object returned by an LLM client."""

    answer: str
    page_key: Optional[str]
    input_tokens: int = 0
    output_tokens: int = 0


class LLMClient(ABC):
    """Abstract interface for LLM integrations."""

    @abstractmethod
    async def generate_response(
        self,
        system_prompt: str,
        history: List[LLMMessage],
        user_message: str,
    ) -> LLMResponse:
        """Generate structured response given prompt, history, and user message.

        Args:
            system_prompt: Full system instructions and knowledge context.
            history: Conversation turn history preceding current message.
            user_message: User query string.

        Returns:
            LLMResponse object containing answer, page_key, and token metrics.
        """
        pass
