"""Tests for answer_type classification, actions, suggestions, and backward compatibility."""

import pytest
from fastapi.testclient import TestClient

from app.api.chat import get_llm_client
from app.llm.base import LLMResponse
from app.main import app


class DummyLLMClient:
    """Mock LLMClient for returning pre-configured responses in unit tests."""

    def __init__(self, response: LLMResponse):
        self.response = response

    async def generate_response(self, system_prompt: str, history: list, user_message: str) -> LLMResponse:
        return self.response


def test_answered_with_page() -> None:
    """Test 'answered' type response when a page reference is present."""
    mock_resp = LLMResponse(
        answer="EduCrop provides AMS and RMS.",
        page_key="product",
        answer_type="answered",
        suggestion_keys=["benefits", "about"],
    )
    app.dependency_overrides[get_llm_client] = lambda: DummyLLMClient(mock_resp)

    try:
        with TestClient(app) as client:
            res = client.post(
                "/api/chat",
                json={"session_id": "test-sess-1", "message": "What modules exist?"},
            )
            assert res.status_code == 200
            data = res.json()
            assert data["answer"] == "EduCrop provides AMS and RMS."
            assert data["page"] == {"key": "product", "label": "Product", "url": "/product"}
            assert data["answer_type"] == "answered"
            assert len(data["actions"]) == 1
            assert data["actions"][0]["type"] == "navigate"
            assert data["actions"][0]["url"] == "/product"
            assert data["suggestions"] == ["Benefits of EduCrop", "About Us"]
    finally:
        app.dependency_overrides.clear()


def test_answered_without_page() -> None:
    """Test 'answered' type response without a page reference."""
    mock_resp = LLMResponse(
        answer="Yes, all institutional data is encrypted.",
        page_key=None,
        answer_type="answered",
        suggestion_keys=None,
    )
    app.dependency_overrides[get_llm_client] = lambda: DummyLLMClient(mock_resp)

    try:
        with TestClient(app) as client:
            res = client.post(
                "/api/chat",
                json={"session_id": "test-sess-2", "message": "Is data secure?"},
            )
            assert res.status_code == 200
            data = res.json()
            assert data["answer_type"] == "answered"
            assert data["page"] is None
            assert data["actions"] == []
            assert data["suggestions"] == []
    finally:
        app.dependency_overrides.clear()


def test_not_found_response_actions_and_suggestions() -> None:
    """Test 'not_found' always gets contact page, navigate action, email action, and 2-3 suggestions."""
    mock_resp = LLMResponse(
        answer="I don't have that information right now. You can reach the school directly using the options below.",
        page_key=None,
        answer_type="not_found",
        suggestion_keys=["contact"],
    )
    app.dependency_overrides[get_llm_client] = lambda: DummyLLMClient(mock_resp)

    try:
        with TestClient(app) as client:
            res = client.post(
                "/api/chat",
                json={"session_id": "test-sess-3", "message": "What is the fee structure?"},
            )
            assert res.status_code == 200
            data = res.json()
            assert data["answer_type"] == "not_found"
            assert data["page"] == {"key": "contact", "label": "Contact", "url": "/contact"}
            assert len(data["actions"]) == 2
            assert data["actions"][0] == {"type": "navigate", "label": "View Contact", "url": "/contact", "value": None, "subject": None}
            assert data["actions"][1]["type"] == "email"
            assert data["actions"][1]["value"] == "Educropblr@gmail.com"
            assert data["actions"][1]["subject"] == "Question from website"
            assert len(data["suggestions"]) >= 2
            # Ensure no suggestion contains contact
            for sug in data["suggestions"]:
                assert "contact" not in sug.lower()
    finally:
        app.dependency_overrides.clear()


def test_not_found_excludes_contact_suggestions() -> None:
    """Test that 'not_found' answer_type excludes contact suggestions and fills with non-contact config suggestions."""
    mock_resp = LLMResponse(
        answer="I don't have that information right now. You can reach the school directly using the options below.",
        page_key=None,
        answer_type="not_found",
        suggestion_keys=["contact", "benefits", "about"],
    )
    app.dependency_overrides[get_llm_client] = lambda: DummyLLMClient(mock_resp)

    try:
        with TestClient(app) as client:
            res = client.post(
                "/api/chat",
                json={"session_id": "test-sess-nf-sug", "message": "What is the fee structure?"},
            )
            assert res.status_code == 200
            data = res.json()
            assert data["answer_type"] == "not_found"
            for sug in data["suggestions"]:
                assert "contact" not in sug.lower()
            assert len(data["suggestions"]) >= 2
    finally:
        app.dependency_overrides.clear()


def test_off_topic_response_no_page_no_email() -> None:
    """Test 'off_topic' has no page, no email action, and 2-3 steering suggestions."""
    mock_resp = LLMResponse(
        answer="I am an assistant for EduCrop. I can only answer questions about our platform.",
        page_key=None,
        answer_type="off_topic",
        suggestion_keys=[],
    )
    app.dependency_overrides[get_llm_client] = lambda: DummyLLMClient(mock_resp)

    try:
        with TestClient(app) as client:
            res = client.post(
                "/api/chat",
                json={"session_id": "test-sess-4", "message": "Write me a poem"},
            )
            assert res.status_code == 200
            data = res.json()
            assert data["answer_type"] == "off_topic"
            assert data["page"] is None
            assert data["actions"] == []
            assert len(data["suggestions"]) >= 2
    finally:
        app.dependency_overrides.clear()


def test_unknown_suggestion_keys_ignored() -> None:
    """Test that invalid/unknown suggestion keys from LLM are ignored."""
    mock_resp = LLMResponse(
        answer="Here is information about our product.",
        page_key="product",
        answer_type="answered",
        suggestion_keys=["invalid_key_1", "benefits", "unknown_key_2"],
    )
    app.dependency_overrides[get_llm_client] = lambda: DummyLLMClient(mock_resp)

    try:
        with TestClient(app) as client:
            res = client.post(
                "/api/chat",
                json={"session_id": "test-sess-5", "message": "Tell me about product"},
            )
            assert res.status_code == 200
            data = res.json()
            assert data["suggestions"] == ["Benefits of EduCrop"]
    finally:
        app.dependency_overrides.clear()


def test_backward_compatibility_old_clients() -> None:
    """Test old clients reading only 'answer' and 'page' still work without breaking."""
    mock_resp = LLMResponse(
        answer="EduCrop provides campus automation.",
        page_key="home",
        answer_type="answered",
        suggestion_keys=["benefits"],
    )
    app.dependency_overrides[get_llm_client] = lambda: DummyLLMClient(mock_resp)

    try:
        with TestClient(app) as client:
            res = client.post(
                "/api/chat",
                json={"session_id": "test-sess-6", "message": "Hello"},
            )
            assert res.status_code == 200
            data = res.json()
            # Old clients look specifically for 'answer' and 'page'
            assert "answer" in data
            assert "page" in data
            assert data["answer"] == "EduCrop provides campus automation."
            assert data["page"]["url"] == "/"
    finally:
        app.dependency_overrides.clear()
