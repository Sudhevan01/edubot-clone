"""Tests for TTS cache invalidation on configuration change."""

import json
from pathlib import Path
from app.config import Settings
from app.tts import clear_tts_cache_if_config_changed


def test_tts_cache_cleared_on_config_change(tmp_path: Path) -> None:
    """Verify that cached .wav files are purged when GEMINI_TTS_VOICE changes."""
    cache_dir = tmp_path / "audio_cache"
    cache_dir.mkdir(parents=True, exist_ok=True)

    # Initial settings
    settings = Settings(
        GEMINI_TTS_VOICE="Kore",
        GEMINI_TTS_STYLE="speak warmly",
        TTS_CACHE_DIR=cache_dir,
    )

    # Create dummy cached files
    (cache_dir / "sample_1.wav").write_bytes(b"RIFF dummy 1")
    (cache_dir / "sample_2.wav").write_bytes(b"RIFF dummy 2")

    # Initial check (first run creates metadata)
    clear_tts_cache_if_config_changed(settings)

    # Metadata file should exist
    meta_path = cache_dir / "cache_meta.json"
    assert meta_path.exists()
    with open(meta_path, "r", encoding="utf-8") as f:
        meta = json.load(f)
    assert meta["voice"] == "Kore"

    # Add a cached file
    (cache_dir / "sample_3.wav").write_bytes(b"RIFF dummy 3")

    # Second run with same settings should NOT clear cache
    cleared = clear_tts_cache_if_config_changed(settings)
    assert not cleared
    assert (cache_dir / "sample_3.wav").exists()

    # Third run with new voice should CLEAR cache
    new_settings = Settings(
        GEMINI_TTS_VOICE="Aoede",
        GEMINI_TTS_STYLE="speak warmly",
        TTS_CACHE_DIR=cache_dir,
    )
    cleared = clear_tts_cache_if_config_changed(new_settings)
    assert cleared
    assert not (cache_dir / "sample_3.wav").exists()
    assert (cache_dir / "cache_meta.json").exists()
    with open(meta_path, "r", encoding="utf-8") as f:
        updated_meta = json.load(f)
    assert updated_meta["voice"] == "Aoede"


def test_clean_text_for_tts() -> None:
    """Verify markdown and emojis are stripped cleanly for speech synthesis."""
    from app.tts import clean_text_for_tts

    raw = "**EduCrop** is great! Email us at info@educrop.com. Check [Docs](https://educrop.com) 🚀."
    cleaned = clean_text_for_tts(raw)
    assert "**" not in cleaned
    assert "🚀" not in cleaned
    assert "info at educrop dot com" in cleaned
    assert "Docs" in cleaned
    assert "https://" not in cleaned


def test_synthesize_speech_cache_hit(tmp_path: Path) -> None:
    """Verify that cached audio is read without invoking external APIs."""
    from app.tts import get_cache_key, synthesize_speech

    cache_dir = tmp_path / "audio_cache"
    cache_dir.mkdir(parents=True, exist_ok=True)

    settings = Settings(
        GEMINI_TTS_VOICE="Kore",
        GEMINI_TTS_STYLE="speak warmly",
        TTS_CACHE_DIR=cache_dir,
    )

    text = "Hello welcome to EduCrop"
    key = get_cache_key(text, "Kore", "speak warmly")
    dummy_wav = b"RIFF dummy wav audio"
    (cache_dir / f"{key}.wav").write_bytes(dummy_wav)

    result = synthesize_speech(text, settings=settings)
    assert result == dummy_wav


def test_chat_tts_api_endpoint(tmp_path: Path) -> None:
    """Verify POST /api/chat/tts serves audio/wav from cache."""
    from fastapi.testclient import TestClient
    from app.main import create_app
    from app.tts import get_cache_key

    cache_dir = tmp_path / "audio_cache"
    cache_dir.mkdir(parents=True, exist_ok=True)

    test_settings = Settings(
        GEMINI_TTS_VOICE="Kore",
        GEMINI_TTS_STYLE="speak warmly",
        TTS_CACHE_DIR=cache_dir,
    )

    app = create_app()
    from app.config import get_settings
    app.dependency_overrides[get_settings] = lambda: test_settings

    client = TestClient(app)

    text = "Welcome to EduCrop learning management"
    key = get_cache_key(text, "Kore", "speak warmly")
    dummy_wav = b"RIFF cached test wav bytes"
    (cache_dir / f"{key}.wav").write_bytes(dummy_wav)

    resp = client.post("/api/chat/tts", json={"text": text})
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "audio/wav"
    assert resp.content == dummy_wav

    # Test empty text validation
    err_resp = client.post("/api/chat/tts", json={"text": "   "})
    assert err_resp.status_code == 400
