"""Input sanitization and validation module."""

import re


class InputValidationError(Exception):
    """Exception raised when input fails sanitization or length validation."""

    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


def sanitize_input(text: str) -> str:
    """Strip ASCII control characters except tab, newline, and carriage return."""
    if not text:
        return ""
    # Strip C0 and C1 control characters except \t (\x09), \n (\x0A), \r (\x0D)
    cleaned = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]", "", text)
    return cleaned.strip()


def validate_input(text: str) -> str:
    """Sanitize input and validate message length constraints.

    Raises:
        InputValidationError: If message is empty or exceeds 500 characters.

    Returns:
        Sanitized message string.
    """
    sanitized = sanitize_input(text)

    if not sanitized:
        raise InputValidationError(
            code="too_long",
            message="Message cannot be empty.",
        )

    if len(sanitized) > 500:
        raise InputValidationError(
            code="too_long",
            message="Message is too long. Please limit your message to 500 characters.",
        )

    return sanitized
