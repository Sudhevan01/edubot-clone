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


def test_two_different_texts_both_generate_audio_with_configured_voice(tmp_path: Path) -> None:
    """Confirm two different texts both generate audio with the configured voice (Kore), ignoring client overrides."""
    from unittest.mock import MagicMock, patch
    from fastapi.testclient import TestClient
    from app.main import create_app
    from app.config import get_settings

    cache_dir = tmp_path / "audio_cache"
    cache_dir.mkdir(parents=True, exist_ok=True)

    test_settings = Settings(
        GEMINI_API_KEY="test-gemini-key",
        GEMINI_TTS_VOICE="Kore",
        GEMINI_TTS_MODEL="gemini-3.8-flash-lite-tts",
        TTS_PROVIDER="gemini",
        GEMINI_TTS_STYLE="speak as a warm, friendly female assistant",
        TTS_CACHE_DIR=cache_dir,
    )

    app = create_app()
    app.dependency_overrides[get_settings] = lambda: test_settings
    client = TestClient(app)

    # Mock Gemini Client generate_content
    fake_wav_1 = b"RIFF" + b"\x00" * 50 + b"audio_text_one"
    fake_wav_2 = b"RIFF" + b"\x00" * 50 + b"audio_text_two"

    part_mock_1 = MagicMock()
    part_mock_1.inline_data = MagicMock(data=fake_wav_1)
    cand_mock_1 = MagicMock(content=MagicMock(parts=[part_mock_1]))
    resp_mock_1 = MagicMock(candidates=[cand_mock_1])

    part_mock_2 = MagicMock()
    part_mock_2.inline_data = MagicMock(data=fake_wav_2)
    cand_mock_2 = MagicMock(content=MagicMock(parts=[part_mock_2]))
    resp_mock_2 = MagicMock(candidates=[cand_mock_2])

    with patch("google.genai.Client") as mock_client_cls:
        mock_client = MagicMock()
        mock_client_cls.return_value = mock_client
        mock_client.models.generate_content.side_effect = [resp_mock_1, resp_mock_2]

        # 1. First text (welcome message style text) via /api/tts
        text_1 = "Hello! I am EduBot - your EduCrop AI assistant."
        res_1 = client.post("/api/tts", json={"text": text_1})
        assert res_1.status_code == 200
        assert res_1.headers["content-type"] == "audio/wav"
        assert res_1.content == fake_wav_1

        # 2. Second text (normal bot reply) via /api/tts, with client attempting a voice override
        text_2 = "EduCrop offers comprehensive academic and fee management modules."
        res_2 = client.post("/api/tts", json={"text": text_2, "voice": "Aoede"})
        assert res_2.status_code == 200
        assert res_2.headers["content-type"] == "audio/wav"
        assert res_2.content == fake_wav_2

        # Verify generate_content was called twice
        assert mock_client.models.generate_content.call_count == 2
        calls = mock_client.models.generate_content.call_args_list

        # Verify first call used configured voice "Kore"
        call_1_cfg = calls[0].kwargs["config"]
        call_1_voice = call_1_cfg.speech_config.voice_config.prebuilt_voice_config.voice_name
        assert call_1_voice == "Kore", f"Expected voice 'Kore', got '{call_1_voice}'"

        # Verify second call ALSO used configured voice "Kore", ignoring client voice "Aoede"
        call_2_cfg = calls[1].kwargs["config"]
        call_2_voice = call_2_cfg.speech_config.voice_config.prebuilt_voice_config.voice_name
        assert call_2_voice == "Kore", f"Expected voice 'Kore', got '{call_2_voice}'"

        # Verify cached files were created in cache_dir for both distinct keys
        cached_files = list(cache_dir.glob("*.wav"))
        assert len(cached_files) == 2
