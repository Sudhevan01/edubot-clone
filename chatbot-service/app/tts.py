"""TTS voice synthesis and audio cache management module."""

import hashlib
import json
from pathlib import Path
from typing import Optional

from google import genai
from google.genai import types

from app.config import Settings, get_settings
from app.logging_config import logger


def clear_tts_cache(settings: Optional[Settings] = None) -> int:
    """Clear all cached audio files (.wav) from the TTS cache directory on startup.

    Returns:
        Number of cached audio files removed.
    """
    if settings is None:
        settings = get_settings()

    cache_dir = Path(settings.TTS_CACHE_DIR)
    cache_dir.mkdir(parents=True, exist_ok=True)
    cleared_count = 0

    for ext in ("*.wav", "*.mp3"):
        for file_path in cache_dir.glob(ext):
            try:
                file_path.unlink()
                cleared_count += 1
            except Exception as err:
                logger.warning(f"Could not delete cache file {file_path}: {err}")

    meta_file = cache_dir / "cache_meta.json"
    current_meta = {
        "provider": getattr(settings, "TTS_PROVIDER", "gemini"),
        "model": settings.GEMINI_TTS_MODEL,
        "voice": settings.GEMINI_TTS_VOICE,
        "style": settings.GEMINI_TTS_STYLE,
    }
    try:
        with open(meta_file, "w", encoding="utf-8") as f:
            json.dump(current_meta, f, indent=2)
    except Exception as err:
        logger.warning(f"Failed to write TTS cache metadata to {meta_file}: {err}")

    logger.info(f"Cleared TTS audio cache on startup ({cleared_count} files removed from {cache_dir})")
    return cleared_count


def prewarm_tts_cache(settings: Optional[Settings] = None) -> None:
    """Pre-warm cache with standard welcome greeting so it plays instantly."""
    if settings is None:
        settings = get_settings()
    welcome_text = (
        "Hello! I'm EduBot - your EduCrop AI assistant. I can help you with "
        "product info, features, and more. What would you like to know today?"
    )
    try:
        synthesize_speech(welcome_text, settings=settings)
        logger.info("Pre-warmed TTS cache for welcome message greeting.")
    except Exception as err:
        logger.warning(f"Could not pre-warm welcome message TTS: {err}")


def clear_tts_cache_if_config_changed(settings: Optional[Settings] = None) -> bool:
    """Clear TTS audio cache if configured provider, model, voice, or style changed.

    Returns:
        True if the cache was cleared, False otherwise.
    """
    if settings is None:
        settings = get_settings()

    cache_dir = Path(settings.TTS_CACHE_DIR)
    cache_dir.mkdir(parents=True, exist_ok=True)
    meta_file = cache_dir / "cache_meta.json"

    current_meta = {
        "provider": getattr(settings, "TTS_PROVIDER", "gemini"),
        "model": settings.GEMINI_TTS_MODEL,
        "voice": settings.GEMINI_TTS_VOICE,
        "style": settings.GEMINI_TTS_STYLE,
    }

    cache_cleared = False

    if meta_file.exists():
        try:
            with open(meta_file, "r", encoding="utf-8") as f:
                saved_meta = json.load(f)
            if (
                saved_meta.get("provider") != current_meta["provider"]
                or saved_meta.get("model") != current_meta["model"]
                or saved_meta.get("voice") != current_meta["voice"]
                or saved_meta.get("style") != current_meta["style"]
            ):
                logger.info(
                    f"TTS configuration changed (voice: '{saved_meta.get('voice')}' -> '{current_meta['voice']}', "
                    f"model: '{saved_meta.get('model')}' -> '{current_meta['model']}'). "
                    f"Clearing old audio cache in {cache_dir}..."
                )
                for ext in ("*.wav", "*.mp3"):
                    for file_path in cache_dir.glob(ext):
                        try:
                            file_path.unlink()
                        except Exception as err:
                            logger.warning(f"Could not delete cache file {file_path}: {err}")
                cache_cleared = True
        except Exception as err:
            logger.warning(f"Could not parse TTS cache metadata: {err}. Purging cache.")
            for ext in ("*.wav", "*.mp3"):
                for file_path in cache_dir.glob(ext):
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


def get_cache_key(
    text: str,
    voice: Optional[str] = None,
    style: Optional[str] = None,
    provider: Optional[str] = None,
    model: Optional[str] = None,
    *,
    settings: Optional[Settings] = None,
) -> str:
    """Compute a deterministic MD5 hash for audio caching including provider, model, voice, and style."""
    if settings is None:
        try:
            settings = get_settings()
        except Exception:
            settings = None

    p = provider or (getattr(settings, "TTS_PROVIDER", "gemini") if settings else "gemini")
    m = model or (getattr(settings, "GEMINI_TTS_MODEL", "gemini-3.8-flash-lite-tts") if settings else "gemini-3.8-flash-lite-tts")
    v = voice or (getattr(settings, "GEMINI_TTS_VOICE", "Kore") if settings else "Kore")
    s = style if style is not None else (getattr(settings, "GEMINI_TTS_STYLE", "") if settings else "")

    key_src = f"{p}::{m}::{v}::{s}::{text.strip()}"
    return hashlib.md5(key_src.encode("utf-8")).hexdigest()


TTS_MODELS = [
    "gemini-2.5-flash-preview-tts",
    "gemini-3.8-flash-tts",
    "gemini-3.1-flash-tts-preview",
    "gemini-3.8-flash-lite-tts",
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

    Always enforces the configured voice, model, provider, and style. If any fallback
    or override attempt is detected, it is logged as a WARNING with the reason.

    Returns:
        WAV audio bytes.
    """
    if settings is None:
        settings = get_settings()

    clean_text = clean_text_for_tts(text)
    if not clean_text:
        return b""

    provider = getattr(settings, "TTS_PROVIDER", "gemini")
    configured_voice = settings.GEMINI_TTS_VOICE
    configured_model = settings.GEMINI_TTS_MODEL
    style = settings.GEMINI_TTS_STYLE

    if voice is not None and voice != configured_voice:
        logger.warning(
            f"TTS voice mismatch: request specified voice='{voice}', overriding with configured voice='{configured_voice}'. "
            f"Reason: Configured voice '{configured_voice}' is enforced for all requests."
        )

    chosen_voice = configured_voice

    cache_dir = Path(settings.TTS_CACHE_DIR)
    cache_dir.mkdir(parents=True, exist_ok=True)

    cache_key = get_cache_key(
        clean_text,
        voice=chosen_voice,
        style=style,
        provider=provider,
        model=configured_model,
        settings=settings,
    )
    cached_file_wav = cache_dir / f"{cache_key}.wav"
    cached_file_mp3 = cache_dir / f"{cache_key}.mp3"

    for c_file in (cached_file_wav, cached_file_mp3):
        if c_file.exists() and c_file.stat().st_size > 0:
            logger.info(
                f"TTS audio cache hit for key {cache_key[:8]} "
                f"(provider={provider}, model={configured_model}, voice={chosen_voice})"
            )
            return c_file.read_bytes()

    cached_file = cached_file_wav

    if not settings.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not configured for TTS audio generation.")

    client = genai.Client(
        api_key=settings.GEMINI_API_KEY,
        http_options=types.HttpOptions(timeout=25000),
    )

    # Try models in order, automatically skipping any that exhausted quota
    models_to_try = [
        m
        for m in [configured_model] + TTS_MODELS
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
        ordered_models = [configured_model] + [m for m in TTS_MODELS if m != configured_model]

    last_error: Optional[Exception] = None

    for model in ordered_models:
        if model != configured_model:
            logger.warning(
                f"TTS model fallback triggered: using fallback model '{model}' instead of configured model '{configured_model}'. "
                f"Reason: Configured model was exhausted or experienced an error."
            )

        try:
            logger.info(
                f"Calling Gemini TTS provider '{provider}', model '{model}' with voice '{chosen_voice}'..."
            )
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
                            f"TTS audio generated & cached ({len(audio_data)} bytes, key={cache_key[:8]}, voice={chosen_voice})"
                        )
                        return audio_data
        except Exception as exc:
            err_msg = str(exc)
            if "RESOURCE_EXHAUSTED" in err_msg or "429" in err_msg or "quota" in err_msg.lower():
                logger.warning(f"TTS model '{model}' reached quota. Marking exhausted.")
                _exhausted_tts_models.add(model)
            else:
                logger.warning(f"Gemini TTS generation failed on model '{model}': {exc}")
    # If all configured Gemini TTS models were exhausted or failed, try edge-tts fallback provider
    try:
        import asyncio
        import edge_tts

        logger.warning(
            f"TTS provider fallback triggered: using fallback provider 'edge-tts' with voice 'en-IN-NeerjaExpressiveNeural' instead of provider '{provider}'. "
            f"Reason: Configured provider '{provider}' models were exhausted (Google Free Tier 10 requests/day limit reached) or experienced an error: {last_error}"
        )

        async def _synthesize_edge() -> bytes:
            communicate = edge_tts.Communicate(clean_text, "en-IN-NeerjaExpressiveNeural")
            chunks = []
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    chunks.append(chunk["data"])
            return b"".join(chunks)

        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as pool:
                    edge_audio = pool.submit(asyncio.run, _synthesize_edge()).result()
            else:
                edge_audio = loop.run_until_complete(_synthesize_edge())
        except Exception:
            edge_audio = asyncio.run(_synthesize_edge())

        if edge_audio and len(edge_audio) > 0:
            cached_file_mp3.write_bytes(edge_audio)
            logger.info(
                f"TTS audio generated & cached via fallback edge-tts ({len(edge_audio)} bytes, key={cache_key[:8]})"
            )
            return edge_audio
    except Exception as fallback_err:
        logger.warning(f"Fallback edge-tts synthesis failed: {fallback_err}")

    raise last_error or RuntimeError(f"Failed to generate TTS audio for voice {chosen_voice}")

