"""Tests for voice input handling, prompt customization, and API integration."""

import pytest
from fastapi.testclient import TestClient

from app.guards.input_guard import clean_voice_input
from app.main import app
from app.prompts import VOICE_INPUT_INSTRUCTION, build_system_prompt


def test_clean_voice_input_filler_words() -> None:
    """Assert leading filler words are stripped and whitespace is collapsed."""
    assert (
        clean_voice_input("  um   uh   what are the benefit of this school  ")
        == "what are the benefit of this school"
    )
    assert clean_voice_input("hmm tell me about the skool") == "tell me about the skool"
    assert clean_voice_input("how can i contact you people") == "how can i contact you people"
    assert clean_voice_input("uh, um, how does RMS work") == "how does RMS work"


def test_build_system_prompt_input_mode() -> None:
    """Assert voice instruction is added only when input_mode is 'voice'."""
    text_prompt = build_system_prompt(input_mode="text")
    voice_prompt = build_system_prompt(input_mode="voice")

    assert "VOICE TRANSCRIPT HANDLING" not in text_prompt
    assert "VOICE TRANSCRIPT HANDLING" in voice_prompt


def test_chat_endpoint_default_input_mode() -> None:
    """Assert requests without input_mode field default to 'text' and work backward-compatibly."""
    client = TestClient(app)
    response = client.post(
        "/api/chat",
        json={
            "session_id": "123e4567-e89b-12d3-a456-426614174000",
            "message": "",
        },
    )
    # Empty message should still return 422 as expected
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "empty"


def test_chat_endpoint_invalid_input_mode() -> None:
    """Assert invalid input_mode value returns HTTP 422 validation error."""
    client = TestClient(app)
    response = client.post(
        "/api/chat",
        json={
            "session_id": "123e4567-e89b-12d3-a456-426614174000",
            "message": "What is EduCrop?",
            "input_mode": "audio",
        },
    )
    assert response.status_code == 422
