"""Tests for input validation and sanitization module."""

import pytest
from fastapi.testclient import TestClient

from app.guards.input_guard import InputValidationError, validate_input
from app.main import app


@pytest.mark.parametrize("empty_input", ["", "   ", "\n\t"])
def test_validate_input_empty(empty_input: str) -> None:
    """Assert empty or whitespace-only inputs raise InputValidationError with code 'empty'."""
    with pytest.raises(InputValidationError) as exc_info:
        validate_input(empty_input)
    assert exc_info.value.code == "empty"
    assert exc_info.value.message == "Message must not be empty."


def test_validate_input_too_long() -> None:
    """Assert inputs over 500 characters raise InputValidationError with code 'too_long'."""
    long_input = "a" * 501
    with pytest.raises(InputValidationError) as exc_info:
        validate_input(long_input)
    assert exc_info.value.code == "too_long"
    assert exc_info.value.message == "Message is too long. Please limit your message to 500 characters."


def test_validate_input_valid() -> None:
    """Assert valid inputs pass validation and return sanitized text."""
    result = validate_input("  Hello EduCrop!  ")
    assert result == "Hello EduCrop!"


@pytest.mark.parametrize("empty_input", ["", "   ", "\n\t"])
def test_chat_endpoint_empty_input(empty_input: str) -> None:
    """Assert /api/chat returns HTTP 422 with code 'empty' for empty message."""
    client = TestClient(app)
    response = client.post(
        "/api/chat",
        json={
            "session_id": "123e4567-e89b-12d3-a456-426614174000",
            "message": empty_input,
        },
    )
    assert response.status_code == 422
    data = response.json()
    assert data["error"]["code"] == "empty"
    assert data["error"]["message"] == "Message must not be empty."
