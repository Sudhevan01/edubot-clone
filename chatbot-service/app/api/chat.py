"""Chat API endpoint router with full protection guards and OpenAPI examples."""

import time
from typing import Optional
from fastapi import APIRouter, Depends, Request, status
from fastapi.responses import JSONResponse

from app.api.schemas import (
    ActionItem,
    ChatRequest,
    ChatResponse,
    ErrorResponse,
    PageResponse,
)
from app.config import Settings, get_settings
from app.guards.cost_tracker import CostTracker, SpendCapExceeded, default_cost_tracker
from app.guards.input_guard import (
    InputValidationError,
    clean_voice_input,
    validate_input,
)
from app.guards.rate_limiter import (
    RateLimitExceeded,
    RateLimiter,
    default_rate_limiter,
    get_client_ip,
)
from app.history import HistoryStore, default_history_store
from app.knowledge import get_page_by_key
from app.llm.base import LLMClient
from app.llm.gemini import GeminiLLMClient
from app.logging_config import logger
from app.prompts import build_system_prompt

router = APIRouter(tags=["Chat"])

# Singleton LLM client instance
_llm_client: Optional[LLMClient] = None


def get_llm_client() -> LLMClient:
    """Dependency provider for LLMClient."""
    global _llm_client
    if _llm_client is None:
        _llm_client = GeminiLLMClient()
    return _llm_client


def get_history_store() -> HistoryStore:
    """Dependency provider for HistoryStore."""
    return default_history_store


def get_rate_limiter() -> RateLimiter:
    """Dependency provider for RateLimiter."""
    return default_rate_limiter


def get_cost_tracker() -> CostTracker:
    """Dependency provider for CostTracker."""
    return default_cost_tracker


chat_openapi_responses = {
    200: {
        "model": ChatResponse,
        "description": "Successful chat response with answer and optional landing page route.",
        "content": {
            "application/json": {
                "examples": {
                    "answer_with_page": {
                        "summary": "Normal Answer with Page Reference",
                        "value": {
                            "answer": "EduCrop simplifies academic, administrative, financial, and communication processes into one secure platform.",
                            "page": {
                                "key": "benefits",
                                "label": "Benefits",
                                "url": "/benefits",
                            },
                        },
                    },
                    "answer_without_page": {
                        "summary": "Answer without Page Reference",
                        "value": {
                            "answer": "I can only answer questions related to EduCrop. Please feel free to ask about our platform, features, or modules.",
                            "page": None,
                        },
                    },
                }
            }
        },
    },
    400: {
        "model": ErrorResponse,
        "description": "Bad Request - Message exceeds 500 characters limit.",
        "content": {
            "application/json": {
                "example": {
                    "error": {
                        "code": "too_long",
                        "message": "Message is too long. Please limit your message to 500 characters.",
                    }
                }
            }
        },
    },
    422: {
        "model": ErrorResponse,
        "description": "Unprocessable Entity - Message is empty.",
        "content": {
            "application/json": {
                "example": {
                    "error": {
                        "code": "empty",
                        "message": "Message must not be empty.",
                    }
                }
            }
        },
    },
    429: {
        "model": ErrorResponse,
        "description": "Too Many Requests - Rate limit or session message limit reached.",
        "content": {
            "application/json": {
                "example": {
                    "error": {
                        "code": "rate_limited",
                        "message": "Rate limit exceeded: maximum 10 requests per minute allowed. Please wait a moment.",
                    }
                }
            }
        },
    },
    503: {
        "model": ErrorResponse,
        "description": "Service Unavailable - Gemini service failure or daily spend cap reached.",
        "content": {
            "application/json": {
                "examples": {
                    "spend_cap_reached": {
                        "summary": "Daily Spend Cap Reached",
                        "value": {
                            "error": {
                                "code": "unavailable",
                                "message": "The chatbot daily usage limit has been reached. Please visit our Contact page to get in touch with us.",
                            }
                        },
                    },
                    "service_unavailable": {
                        "summary": "LLM Service Error",
                        "value": {
                            "error": {
                                "code": "unavailable",
                                "message": "The chatbot service is temporarily unavailable. Please try again in a moment.",
                            }
                        },
                    },
                }
            }
        },
    },
}


@router.post(
    "/api/chat",
    response_model=ChatResponse,
    responses=chat_openapi_responses,
    summary="Chat with EduCrop Bot",
    description=(
        "Process visitor question using landing page knowledge base. "
        "Enforces rate limits (10/min, 100/day per IP; 40 msgs/session), "
        "input limits (max 500 chars), and daily cost caps."
    ),
)
async def chat_endpoint(
    req: Request,
    request: ChatRequest,
    llm_client: LLMClient = Depends(get_llm_client),
    history_store: HistoryStore = Depends(get_history_store),
    rate_limiter: RateLimiter = Depends(get_rate_limiter),
    cost_tracker: CostTracker = Depends(get_cost_tracker),
    settings: Settings = Depends(get_settings),
) -> ChatResponse:
    """Handle chat message with rate limiting, input validation, and cost tracking."""
    client_ip = get_client_ip(req, trust_proxy=settings.TRUST_PROXY)

    # 1. Input Sanitization & Length Validation
    try:
        clean_message = validate_input(request.message)
        if request.input_mode == "voice":
            clean_message = clean_voice_input(clean_message)
            if not clean_message:
                raise InputValidationError(
                    code="empty",
                    message="Message must not be empty.",
                )
    except InputValidationError as err:
        status_code = (
            status.HTTP_422_UNPROCESSABLE_ENTITY
            if err.code == "empty"
            else status.HTTP_400_BAD_REQUEST
        )
        return JSONResponse(
            status_code=status_code,
            content={
                "error": {
                    "code": err.code,
                    "message": err.message,
                }
            },
        )

    # 2. Check Daily Spend Cap
    try:
        await cost_tracker.check_cap(settings)
    except SpendCapExceeded as err:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "error": {
                    "code": "unavailable",
                    "message": err.message,
                }
            },
        )

    # 3. Rate Limiting Check
    try:
        await rate_limiter.check_and_increment(client_ip, request.session_id, settings)
    except RateLimitExceeded as err:
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "error": {
                    "code": "rate_limited",
                    "message": err.message,
                }
            },
        )

    start_time = time.perf_counter()

    try:
        # 4. Build system prompt and load history
        system_prompt = build_system_prompt(settings, input_mode=request.input_mode)
        history = await history_store.get_history(request.session_id)

        # 5. Call LLM Client
        llm_resp = await llm_client.generate_response(
            system_prompt=system_prompt,
            history=history,
            user_message=clean_message,
        )

        # 6. Record Token Usage Cost
        turn_cost = await cost_tracker.record_usage(
            llm_resp.input_tokens, llm_resp.output_tokens, settings
        )

        # 7. Determine answer_type and map page_key / actions / suggestions
        answer_type = (
            llm_resp.answer_type
            if llm_resp.answer_type in ("answered", "not_found", "off_topic")
            else "answered"
        )

        page_obj: Optional[PageResponse] = None
        if answer_type == "not_found":
            contact_page = get_page_by_key("contact")
            if contact_page:
                page_obj = PageResponse(
                    key=contact_page.key,
                    label=contact_page.label,
                    url=contact_page.url,
                )
        elif answer_type == "answered" and llm_resp.page_key:
            page = get_page_by_key(llm_resp.page_key)
            if page:
                page_obj = PageResponse(key=page.key, label=page.label, url=page.url)

        actions: List[ActionItem] = []
        if answer_type == "answered":
            if page_obj:
                actions.append(
                    ActionItem(
                        type="navigate",
                        label=f"View {page_obj.label}",
                        url=page_obj.url,
                    )
                )
        elif answer_type == "not_found":
            actions.append(
                ActionItem(
                    type="navigate",
                    label="View Contact",
                    url="/contact",
                )
            )
            actions.append(
                ActionItem(
                    type="email",
                    label="Email the school",
                    value=settings.SCHOOL_EMAIL,
                    subject="Question from website",
                )
            )
        elif answer_type == "off_topic":
            actions = []

        suggestions: List[str] = []
        sug_config = settings.SUGGESTIONS_CONFIG
        if llm_resp.suggestion_keys:
            for k in llm_resp.suggestion_keys:
                if k in sug_config and sug_config[k] not in suggestions:
                    suggestions.append(sug_config[k])
                    if len(suggestions) == 3:
                        break

        if answer_type in ("not_found", "off_topic") and len(suggestions) < 2:
            defaults = ["benefits", "about", "product"]
            for k in defaults:
                if k in sug_config:
                    text = sug_config[k]
                    if text not in suggestions:
                        suggestions.append(text)
                    if len(suggestions) >= 3:
                        break

        # 8. Save turn to history
        await history_store.add_turn(
            session_id=request.session_id,
            user_message=clean_message,
            assistant_message=llm_resp.answer,
        )

        # 9. Calculate latency and log metrics (DO NOT log full message text at INFO level)
        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
        logger.info(
            f"Chat processed: input_mode={request.input_mode} answer_type={answer_type} "
            f"question_len={len(clean_message)} page_key={llm_resp.page_key} "
            f"latency_ms={latency_ms} input_tokens={llm_resp.input_tokens} "
            f"output_tokens={llm_resp.output_tokens} cost_usd=${turn_cost:.6f}"
        )

        return ChatResponse(
            answer=llm_resp.answer,
            page=page_obj,
            answer_type=answer_type,
            actions=actions,
            suggestions=suggestions,
        )

    except Exception as exc:
        # Internal error details logged to logger.error, never returned to client
        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
        logger.error(
            f"Error processing chat for session {request.session_id} after {latency_ms}ms: {exc}",
            exc_info=True,
        )

        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "error": {
                    "code": "unavailable",
                    "message": "The chatbot service is temporarily unavailable. Please try again in a moment.",
                }
            },
        )
