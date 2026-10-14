"""Main FastAPI application factory and entry point."""

import uuid
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator
from fastapi import FastAPI, Request, Response, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.api.chat import router as chat_router
from app.api.cost import router as cost_router
from app.api.health import router as health_router
from app.config import get_settings
from app.knowledge import load_knowledge
from app.logging_config import logger, request_id_ctx

SERVICE_DIR = Path(__file__).resolve().parent.parent
KNOWLEDGE_DIR = SERVICE_DIR / "knowledge"


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Lifespan context manager handling startup and shutdown events."""
    settings = get_settings()
    logger.info(f"Starting Chatbot Service ({settings.APP_ENV})")

    # Load knowledge base at startup
    try:
        load_knowledge(KNOWLEDGE_DIR)
    except Exception as err:
        logger.error(f"Failed to load knowledge base at startup: {err}")
        raise err

    yield

    logger.info("Shutting down Chatbot Service")


def create_app() -> FastAPI:
    """FastAPI application factory."""
    settings = get_settings()

    app = FastAPI(
        title="Landing Page Chatbot Backend",
        description="FastAPI service serving landing page visitor chatbot.",
        version="0.1.0",
        lifespan=lifespan,
    )

    # CORS configuration - restrict strictly to ALLOWED_ORIGINS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["*"],
    )

    # Middleware for per-request JSON logging and request ID tracking
    @app.middleware("http")
    async def log_requests(request: Request, call_next) -> Response:
        req_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        token = request_id_ctx.set(req_id)

        logger.info(
            f"Incoming request: {request.method} {request.url.path}"
        )
        try:
            response = await call_next(request)
            logger.info(
                f"Completed request: {request.method} {request.url.path} status={response.status_code}"
            )
            response.headers["X-Request-ID"] = req_id
            return response
        except Exception as exc:
            logger.error(
                f"Unhandled exception during request {request.method} {request.url.path}: {exc}"
            )
            raise exc
        finally:
            request_id_ctx.reset(token)

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        for err in exc.errors():
            if "message" in err.get("loc", ()):
                return JSONResponse(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    content={
                        "error": {
                            "code": "too_long",
                            "message": "Message is invalid or empty.",
                        }
                    },
                )
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"detail": exc.errors()},
        )

    # Register API routers
    app.include_router(health_router)
    app.include_router(cost_router)
    app.include_router(chat_router)

    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
