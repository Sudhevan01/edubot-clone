"""JSON structured logging configuration with request ID tracking."""

import contextvars
import json
import logging
import sys
from typing import Any, Dict

# Context variable for holding request ID per async task/request
request_id_ctx: contextvars.ContextVar[str] = contextvars.ContextVar(
    "request_id", default="-"
)


class JSONFormatter(logging.Formatter):
    """Formatter that outputs structured JSON logs."""

    def format(self, record: logging.LogRecord) -> str:
        """Format the record as a JSON object string."""
        log_data: Dict[str, Any] = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": request_id_ctx.get("-"),
        }

        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        # Include additional extra attributes attached to record if any
        if hasattr(record, "extra") and isinstance(record.extra, dict):
            log_data.update(record.extra)

        return json.dumps(log_data)


def setup_logging(log_level: str = "INFO") -> logging.Logger:
    """Initialize structured JSON logging for the application."""
    logger = logging.getLogger("chatbot")
    logger.setLevel(getattr(logging, log_level.upper(), logging.INFO))

    # Clear existing handlers
    logger.handlers.clear()

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JSONFormatter())
    logger.addHandler(handler)

    # Prevent duplication
    logger.propagate = False

    return logger


logger = setup_logging()
