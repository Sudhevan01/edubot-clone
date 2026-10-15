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
