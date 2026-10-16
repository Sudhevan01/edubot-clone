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


# TTS Models with quota fallback (gemini-3.8-flash-lite-tts prioritized for high speed and fresh quota)
TTS_MODELS = [
    "gemini-3.8-flash-lite-tts",
    "gemini-2.5-flash-preview-tts",
    "gemini-3.1-flash-tts-preview",
    "gemini-3.8-flash-tts",
]

_exhausted_tts_models: set[str] = set()


def clean_text_for_tts(raw_text: str) -> str:
    """Clean markdown, links, and formatting symbols before audio synthesis."""
    if not raw_text:
        return ""
    import re

    text = raw_text
    # Convert email addresses: name@domain.com -> name at domain dot com
    text = re.sub(
        r"([a-zA-Z0-9_.+-]+)@([a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)",
        lambda m: f"{m.group(1)} at {m.group(2).replace('.', ' dot ')}",
        text,
    )
    # Strip markdown links and images
    text = re.sub(r"!\[([^\]]*)\]\([^)]+\)", "", text)
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    # Strip code blocks and inline code
    text = re.sub(r"`([^`]+)`", r"\1", text)
    # Strip headers
    text = re.sub(r"^#{1,6}\s+", "", text, flags=re.MULTILINE)
    # Strip bold / italics
    text = re.sub(r"(\*\*|__)(.*?)\1", r"\2", text)
    text = re.sub(r"(\*|_)(.*?)\1", r"\2", text)
    # Strip bullet points
    text = re.sub(r"^[\s]*[-*+]\s+", "", text, flags=re.MULTILINE)
    text = re.sub(r"^[\s]*\d+\.\s+", "", text, flags=re.MULTILINE)
    # Strip emojis
    text = re.sub(r"[\U00010000-\U0010ffff]", "", text)
    # Collapse whitespace and newlines
    text = re.sub(r"\n+", ". ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def synthesize_speech(
    text: str,
    voice: Optional[str] = None,
    settings: Optional[Settings] = None,
) -> bytes:
    """Synthesize speech audio for text using Gemini TTS with file caching.

    Returns:
        WAV audio bytes.
    """
    if settings is None:
        settings = get_settings()

    clean_text = clean_text_for_tts(text)
    if not clean_text:
        return b""

    chosen_voice = voice or settings.GEMINI_TTS_VOICE
    style = settings.GEMINI_TTS_STYLE

    cache_dir = Path(settings.TTS_CACHE_DIR)
    cache_dir.mkdir(parents=True, exist_ok=True)

    cache_key = get_cache_key(clean_text, chosen_voice, style)
    cached_file = cache_dir / f"{cache_key}.wav"

    if cached_file.exists() and cached_file.stat().st_size > 0:
        logger.info(f"TTS audio cache hit for key {cache_key[:8]} (voice={chosen_voice})")
        return cached_file.read_bytes()

    if not settings.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not configured for TTS audio generation.")

    client = genai.Client(
        api_key=settings.GEMINI_API_KEY,
        http_options=types.HttpOptions(timeout=5000),
    )

    # Try models in order, automatically skipping any that exhausted quota
    models_to_try = [
        m
        for m in [settings.GEMINI_TTS_MODEL] + TTS_MODELS
        if m not in _exhausted_tts_models
    ]
    # Remove duplicates preserving order
    seen = set()
    ordered_models = []
    for m in models_to_try:
        if m not in seen:
            seen.add(m)
            ordered_models.append(m)

    if not ordered_models:
        # Reset exhaustion tracker as last resort if all were marked
        _exhausted_tts_models.clear()
        ordered_models = list(TTS_MODELS)

    last_error: Optional[Exception] = None

    for model in ordered_models:
        try:
            logger.info(f"Calling Gemini TTS model '{model}' with voice '{chosen_voice}'...")
            response = client.models.generate_content(
                model=model,
                contents=clean_text,
                config=types.GenerateContentConfig(
                    response_modalities=["AUDIO"],
                    speech_config=types.SpeechConfig(
                        voice_config=types.VoiceConfig(
                            prebuilt_voice_config=types.PrebuiltVoiceConfig(
                                voice_name=chosen_voice
                            )
                        )
                    ),
                ),
            )
            if response.candidates and response.candidates[0].content.parts:
                part = response.candidates[0].content.parts[0]
                if hasattr(part, "inline_data") and part.inline_data:
                    audio_data = part.inline_data.data
                    if audio_data and len(audio_data) > 0:
                        cached_file.write_bytes(audio_data)
                        logger.info(
                            f"TTS audio generated & cached ({len(audio_data)} bytes, key={cache_key[:8]})"
                        )
                        return audio_data
        except Exception as exc:
            err_msg = str(exc)
            if "RESOURCE_EXHAUSTED" in err_msg or "429" in err_msg or "quota" in err_msg.lower():
                logger.warning(f"TTS model '{model}' reached quota. Marking exhausted.")
                _exhausted_tts_models.add(model)
            else:
                logger.warning(f"Gemini TTS generation failed on model '{model}': {exc}")
            last_error = exc

    raise last_error or RuntimeError(f"Failed to generate TTS audio for voice {chosen_voice}")

