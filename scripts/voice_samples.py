"""Voice sample generator script using Google Gemini TTS.

Generates welcome messages and sample answers in the top six female voices
with the configured Indian English warm, friendly, professional assistant style.
"""

import os
import sys
import time
from pathlib import Path
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Locate project root and load environment variables
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent if SCRIPT_DIR.name == "scripts" and (SCRIPT_DIR.parent / ".env").exists() else SCRIPT_DIR.parent.parent
DOTENV_PATH = PROJECT_ROOT / ".env"
load_dotenv(DOTENV_PATH)

# Output directory for generated samples
OUTPUT_DIR = PROJECT_ROOT / "audio_samples"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# TTS Configuration
STYLE_INSTRUCTION = (
    "speak as a warm, friendly, professional female assistant with a natural "
    "Indian English accent, at a calm and natural pace."
)

# Ordered fallback models with independent quotas
TTS_MODELS = [
    "gemini-3.8-flash-tts",
    "gemini-3.1-flash-tts-preview",
    "gemini-2.5-flash-preview-tts",
    "gemini-3.8-flash-lite-tts",
]

# The 6 best female voices for a warm, professional, friendly assistant
VOICES = [
    ("Kore", "Calm, smooth, and steady middle pitch. Warm, soothing, and reassuring."),
    ("Aoede", "Clear, conversational, thoughtful, and articulate mid-range pitch."),
    ("Leda", "Youthful, energetic yet compassionate, soft, and approachable."),
    ("Zephyr", "Bright, crisp, clear, intelligent, and higher-energy upbeat presentation."),
    ("Sulafat", "Warm, resonant, articulate, and fluid conversational tone."),
    ("Achernar", "Soft, clear, approachable mid-range voice with friendly cadence."),
]

# Texts to generate
WELCOME_TEXT = (
    "Hello! I'm EduBot - your EduCrop AI assistant. "
    "I can help you with product info, features, and more. "
    "What would you like to know today?"
)

SAMPLE_ANSWER_TEXT = (
    "EduCrop is a powerful educational software designed to help schools "
    "and colleges manage their entire operational infrastructure digitally. "
    "It simplifies academic, administrative, financial, and communication "
    "processes for modern institutions."
)

exhausted_models = set()


def generate_audio_with_retry(client: genai.Client, text: str, voice_name: str, max_retries: int = 4) -> bytes:
    """Generate audio bytes with rate limit backoff and multi-model fallback."""
    prompt = f"DIRECTOR'S NOTES:\n{STYLE_INSTRUCTION}\n\nTRANSCRIPT:\n{text}"

    last_error = None

    for attempt in range(1, max_retries + 1):
        available_models = [m for m in TTS_MODELS if m not in exhausted_models]
        if not available_models:
            raise RuntimeError("All configured TTS models have exhausted their quotas.")

        for model in available_models:
            try:
                response = client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_modalities=["AUDIO"],
                        speech_config=types.SpeechConfig(
                            voice_config=types.VoiceConfig(
                                prebuilt_voice_config=types.PrebuiltVoiceConfig(
                                    voice_name=voice_name
                                )
                            )
                        ),
                    ),
                )
                if response.candidates and response.candidates[0].content.parts:
                    part = response.candidates[0].content.parts[0]
                    if hasattr(part, "inline_data") and part.inline_data:
                        return part.inline_data.data
            except Exception as exc:
                last_error = exc
                err_str = str(exc)

                # Check if this model hit its daily limit
                if "PerDay" in err_str or "Day" in err_str:
                    print(f"  [Notice] Model {model} reached daily quota. Switching to next model...", flush=True)
                    exhausted_models.add(model)
                    continue

                # Check if this model hit its per-minute limit
                if "RESOURCE_EXHAUSTED" in err_str or "429" in err_str:
                    print(f"  [Rate Limit / 429 on {model}] Waiting 21s before retry...", flush=True)
                    time.sleep(21.0)
                    # Try next model or retry
                    continue

                time.sleep(1.5)

    raise last_error or RuntimeError(f"Failed to generate audio for voice {voice_name}")


def main() -> None:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("ERROR: GEMINI_API_KEY not found in environment or .env file.", flush=True)
        sys.exit(1)

    client = genai.Client(api_key=api_key)
    print("=" * 70, flush=True)
    print("EduCrop Gemini TTS Voice Samples Generator", flush=True)
    print(f"Output Directory: {OUTPUT_DIR}", flush=True)
    print(f"Style: {STYLE_INSTRUCTION}", flush=True)
    print("=" * 70, flush=True)

    generated_files = []

    for index, (voice, description) in enumerate(VOICES, start=1):
        print(f"\n[{index}/6] Voice: {voice} ({description})", flush=True)

        # 1. Welcome Message
        welcome_file = OUTPUT_DIR / f"welcome_{voice}.wav"
        if welcome_file.exists() and welcome_file.stat().st_size > 10000:
            size_kb = welcome_file.stat().st_size / 1024
            print(f"  -> [Existing] {welcome_file.name} ({size_kb:.1f} KB)", flush=True)
            generated_files.append((voice, "Welcome", welcome_file))
        else:
            print(f"  -> Generating welcome sample: {welcome_file.name}...", flush=True)
            try:
                audio_data = generate_audio_with_retry(client, WELCOME_TEXT, voice)
                welcome_file.write_bytes(audio_data)
                size_kb = len(audio_data) / 1024
                print(f"     [OK] Saved {welcome_file.name} ({size_kb:.1f} KB)", flush=True)
                generated_files.append((voice, "Welcome", welcome_file))
            except Exception as e:
                print(f"     [ERROR] Failed to generate welcome sample for {voice}: {e}", flush=True)
            time.sleep(21.0)

        # 2. Sample Answer
        answer_file = OUTPUT_DIR / f"answer_{voice}.wav"
        if answer_file.exists() and answer_file.stat().st_size > 10000:
            size_kb = answer_file.stat().st_size / 1024
            print(f"  -> [Existing] {answer_file.name} ({size_kb:.1f} KB)", flush=True)
            generated_files.append((voice, "Answer", answer_file))
        else:
            print(f"  -> Generating answer sample: {answer_file.name}...", flush=True)
            try:
                audio_data = generate_audio_with_retry(client, SAMPLE_ANSWER_TEXT, voice)
                answer_file.write_bytes(audio_data)
                size_kb = len(audio_data) / 1024
                print(f"     [OK] Saved {answer_file.name} ({size_kb:.1f} KB)", flush=True)
                generated_files.append((voice, "Answer", answer_file))
            except Exception as e:
                print(f"     [ERROR] Failed to generate answer sample for {voice}: {e}", flush=True)
            time.sleep(21.0)

    print("\n" + "=" * 70, flush=True)
    print("GENERATION SUMMARY:", flush=True)
    print("=" * 70, flush=True)
    for voice, sample_type, path in generated_files:
        print(f"  • {voice:10} | {sample_type:8} | {path}", flush=True)

    print("\n" + "=" * 70, flush=True)
    print("EXACT LINES TO ADD TO .env FOR EACH VOICE:", flush=True)
    print("=" * 70, flush=True)
    for voice, desc in VOICES:
        print(f"# {voice} - {desc}", flush=True)
        print(f"GEMINI_TTS_VOICE={voice}\n", flush=True)


if __name__ == "__main__":
    main()
