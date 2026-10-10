"""Google Gemini LLM client implementation using google-genai SDK."""

import asyncio
import json
from typing import List, Optional
from pydantic import BaseModel, Field
from google import genai
from google.genai import types

from app.config import get_settings
from app.llm.base import LLMClient, LLMMessage, LLMResponse
from app.logging_config import logger


class GeminiResponseSchema(BaseModel):
    """Pydantic schema for structured output from Gemini model."""

    answer: str = Field(
        description="2 to 4 sentence clear, friendly answer based only on knowledge.md",
    )
    page_key: Optional[str] = Field(
        description="Page key from: home, product, docs, about, contact, benefits, or null if no page is relevant",
    )
    answer_type: str = Field(
        description="One of: answered, not_found, off_topic",
    )
    suggestion_keys: Optional[List[str]] = Field(
        description="List of up to 3 keys chosen from: benefits, about, product, contact, docs",
    )


class GeminiLLMClient(LLMClient):
    """LLMClient implementation for Google Gemini models via google-genai."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
    ) -> None:
        """Initialize client with API key and model name."""
        settings = get_settings()
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model_name = model_name or settings.GEMINI_MODEL
        self._client: Optional[genai.Client] = None
        self._cached_content_name: Optional[str] = None
        self._cached_prompt: Optional[str] = None

    def _get_client(self) -> genai.Client:
        """Return or lazily initialize the google-genai Client."""
        if not self._client:
            if not self.api_key:
                raise ValueError("GEMINI_API_KEY is missing or empty")
            self._client = genai.Client(api_key=self.api_key)
        return self._client

    async def _create_context_cache_if_supported(
        self, client: genai.Client, system_prompt: str
    ) -> Optional[str]:
        """Try creating context cache for system prompt if supported."""
        if self._cached_content_name and self._cached_prompt == system_prompt:
            return self._cached_content_name

        try:
            cache = await asyncio.to_thread(
                client.caches.create,
                model=self.model_name,
                config=types.CreateCachedContentConfig(
                    contents=[system_prompt],
                    ttl="1800s",
                ),
            )
            if hasattr(cache, "name") and cache.name:
                self._cached_content_name = cache.name
                self._cached_prompt = system_prompt
                logger.info(f"Created Gemini context cache: {cache.name}")
                return cache.name
        except Exception as err:
            logger.debug(f"Context caching not used/supported for model {self.model_name}: {err}")
        return None

    async def generate_response(
        self,
        system_prompt: str,
        history: List[LLMMessage],
        user_message: str,
    ) -> LLMResponse:
        """Generate response with structured output, timeout, retries, and quota backoff."""
        client = self._get_client()

        contents: List[types.Content] = []
        for msg in history:
            role = "user" if msg.role == "user" else "model"
            contents.append(
                types.Content(
                    role=role,
                    parts=[types.Part.from_text(text=msg.content)],
                )
            )

        contents.append(
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=user_message)],
            )
        )

        cached_name = await self._create_context_cache_if_supported(client, system_prompt)

        config_kwargs = {
            "temperature": 0.2,
            "response_mime_type": "application/json",
            "response_schema": GeminiResponseSchema,
        }

        if cached_name:
            config_kwargs["cached_content"] = cached_name
        else:
            config_kwargs["system_instruction"] = system_prompt

        config = types.GenerateContentConfig(**config_kwargs)

        max_attempts = 4
        last_error: Optional[Exception] = None

        for attempt in range(1, max_attempts + 1):
            try:
                response = await asyncio.wait_for(
                    asyncio.to_thread(
                        client.models.generate_content,
                        model=self.model_name,
                        contents=contents,
                        config=config,
                    ),
                    timeout=20.0,
                )

                raw_text = response.text or ""
                answer_text = ""
                page_key: Optional[str] = None
                answer_type: str = "answered"
                suggestion_keys: Optional[List[str]] = None

                try:
                    data = json.loads(raw_text)
                    if isinstance(data, dict):
                        answer_text = str(data.get("answer", "")).strip()
                        raw_key = data.get("page_key")
                        if isinstance(raw_key, str) and raw_key.strip():
                            page_key = raw_key.strip()
                        raw_type = data.get("answer_type")
                        if isinstance(raw_type, str) and raw_type.strip() in ("answered", "not_found", "off_topic"):
                            answer_type = raw_type.strip()
                        raw_sug = data.get("suggestion_keys")
                        if isinstance(raw_sug, list):
                            suggestion_keys = [str(k).strip() for k in raw_sug if isinstance(k, str) and k.strip()]
                except Exception as parse_err:
                    logger.warning(f"Failed to parse JSON response from Gemini: {parse_err}")
                    answer_text = raw_text.strip()

                input_tokens = 0
                output_tokens = 0
                if hasattr(response, "usage_metadata") and response.usage_metadata:
                    input_tokens = getattr(response.usage_metadata, "prompt_token_count", 0) or 0
                    output_tokens = getattr(response.usage_metadata, "candidates_token_count", 0) or 0

                return LLMResponse(
                    answer=answer_text,
                    page_key=page_key,
                    answer_type=answer_type,
                    suggestion_keys=suggestion_keys,
                    input_tokens=input_tokens,
                    output_tokens=output_tokens,
                )

            except Exception as exc:
                last_error = exc
                err_msg = str(exc)
                logger.warning(
                    f"Gemini generate_content attempt {attempt}/{max_attempts} failed: {exc}"
                )

                if attempt < max_attempts:
                    if "RESOURCE_EXHAUSTED" in err_msg or "429" in err_msg:
                        logger.info("Gemini rate limit hit. Waiting 15s before retry...")
                        await asyncio.sleep(15.0)
                    else:
                        await asyncio.sleep(2.0)

        logger.error(f"All {max_attempts} attempts to Gemini model failed: {last_error}")
        raise last_error or RuntimeError("Gemini API request failed")
