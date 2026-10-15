"""TTS voice synthesis and audio cache management module."""

import hashlib
import json
from pathlib import Path
from typing import Optional

from google import genai
from google.genai import types

from app.config import Settings, get_settings
from app.logging_config import logger


def clear_tts_cache_if_config_changed(settings: Optional[Settings] = None) -> bool:
    """Clear TTS audio cache on startup if configured voice or style changed.

    Returns:
        True if the cache was cleared, False otherwise.
    """
    if settings is None:
        settings = get_settings()

    cache_dir = Path(settings.TTS_CACHE_DIR)
    cache_dir.mkdir(parents=True, exist_ok=True)
    meta_file = cache_dir / "cache_meta.json"

    current_meta = {
        "voice": settings.GEMINI_TTS_VOICE,
        "style": settings.GEMINI_TTS_STYLE,
    }

    cache_cleared = False

    if meta_file.exists():
        try:
            with open(meta_file, "r", encoding="utf-8") as f:
                saved_meta = json.load(f)
            if (
                saved_meta.get("voice") != current_meta["voice"]
                or saved_meta.get("style") != current_meta["style"]
            ):
                logger.info(
                    f"TTS configuration changed (voice: '{saved_meta.get('voice')}' -> '{current_meta['voice']}'). "
                    f"Clearing old audio cache in {cache_dir}..."
                )
                for file_path in cache_dir.glob("*.wav"):
                    try:
                        file_path.unlink()
                    except Exception as err:
                        logger.warning(f"Could not delete cache file {file_path}: {err}")
                cache_cleared = True
        except Exception as err:
            logger.warning(f"Could not parse TTS cache metadata: {err}. Purging cache.")
            for file_path in cache_dir.glob("*.wav"):
                try:
                    file_path.unlink()
                except Exception:
                    pass
            cache_cleared = True
    else:
        # First run or fresh cache: purge any leftover .wav files to ensure clean state
        for file_path in cache_dir.glob("*.wav"):
            try:
                file_path.unlink()
            except Exception:
                pass
        cache_cleared = True

    # Persist updated configuration metadata
    try:
        with open(meta_file, "w", encoding="utf-8") as f:
            json.dump(current_meta, f, indent=2)
    except Exception as err:
        logger.warning(f"Failed to write TTS cache metadata to {meta_file}: {err}")

    return cache_cleared


def get_cache_key(text: str, voice: str, style: str) -> str:
    """Compute a deterministic MD5 hash for audio caching."""
    key_src = f"{voice}::{style}::{text.strip()}"
    return hashlib.md5(key_src.encode("utf-8")).hexdigest()
