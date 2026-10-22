"""Application configuration module using pydantic-settings.

Reads GEMINI_API_KEY from the root .env file and provides sensible
defaults for all other settings.
"""

from functools import lru_cache
import json
from pathlib import Path
from typing import List, Union
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Resolve project root path relative to this file
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DOTENV_PATH = PROJECT_ROOT / ".env"


class Settings(BaseSettings):
    """Application settings schema and defaults."""

    # Only GEMINI_API_KEY is read from root .env file
    GEMINI_API_KEY: str = Field(default="", description="Google Gemini API key")

    # LLM Settings
    GEMINI_MODEL: str = Field(
        default="gemini-3.1-flash-lite",
        description="Google Gemini model name for the chatbot",
    )

    # Security & CORS
    ALLOWED_ORIGINS: Union[List[str], str] = Field(
        default=[
            "https://educrop.com",
            "https://www.educrop.com",
            "https://educrop.netlify.app",
            "http://localhost:5174",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
        ],
        description="Allowed CORS origins",
    )

    # Rate limiting & session rules
    RATE_LIMIT_IP_PER_MINUTE: int = Field(
        default=10, description="Max requests allowed per IP per minute"
    )
    RATE_LIMIT_IP_PER_DAY: int = Field(
        default=100, description="Max requests allowed per IP per day"
    )
    RATE_LIMIT_SESSION_MAX: int = Field(
        default=40, description="Max messages allowed per session_id"
    )

    # Cost tracking & spend cap
    DAILY_SPEND_CAP_USD: float = Field(
        default=5.0, description="Daily spend cap in USD"
    )
    MODEL_INPUT_PRICE_PER_M: float = Field(
        default=0.075, description="Input token price per 1,000,000 tokens in USD"
    )
    MODEL_OUTPUT_PRICE_PER_M: float = Field(
        default=0.30, description="Output token price per 1,000,000 tokens in USD"
    )

    # Institution branding & contact details
    SCHOOL_NAME: str = Field(
        default="EduCrop", description="Institution/School name"
    )
    BOT_NAME: str = Field(
        default="EduCrop Assistant", description="Chatbot assistant name"
    )
    SCHOOL_EMAIL: str = Field(
        default="Educropblr@gmail.com", description="School contact email address"
    )
    FALLBACK_CONTACT: str = Field(
        default="+91 73378 40612",
        description="Fallback contact information for unanswerable queries",
    )
    SUGGESTIONS_CONFIG: dict[str, str] = Field(
        default={
            "benefits": "Benefits of EduCrop",
            "about": "About Us",
            "product": "Our Product & Modules",
            "contact": "Contact Us",
            "docs": "Documentation & Guides",
        },
        description="Fixed mapping of suggestion keys to display prompt text",
    )

    # Server settings
    APP_ENV: str = Field(default="development", description="Application environment")
    TRUST_PROXY: bool = Field(
        default=False, description="Whether to trust reverse proxy X-Forwarded-For headers"
    )

    # TTS Voice Settings
    GEMINI_TTS_VOICE: str = Field(
        default="Kore",
        description="Default prebuilt female voice for Gemini TTS (overridable via GEMINI_TTS_VOICE in .env)",
    )
    GEMINI_TTS_STYLE: str = Field(
        default="speak as a warm, friendly, professional female assistant with a natural Indian English accent, at a calm and natural pace.",
        description="Style instruction for Gemini TTS audio generation",
    )
    GEMINI_TTS_MODEL: str = Field(
        default="gemini-2.5-flash-preview-tts",
        description="Google Gemini model name for TTS speech synthesis",
    )
    TTS_PROVIDER: str = Field(
        default="gemini",
        description="TTS provider name (e.g. gemini)",
    )
    TTS_CACHE_DIR: Path = Field(
        default=PROJECT_ROOT / "chatbot-service" / "audio_cache",
        description="Directory for caching generated TTS audio files",
    )

    model_config = SettingsConfigDict(
        env_file=str(DOTENV_PATH),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("ALLOWED_ORIGINS", mode="after")
    @classmethod
    def parse_allowed_origins(cls, v: Union[str, List[str]]) -> List[str]:
        """Parse string or list into a clean list of origin URLs."""
        if isinstance(v, str):
            v_str = v.strip()
            if v_str.startswith("[") and v_str.endswith("]"):
                try:
                    parsed = json.loads(v_str)
                    if isinstance(parsed, list):
                        return [str(item).strip() for item in parsed if item]
                except Exception:
                    pass
            return [item.strip() for item in v_str.split(",") if item.strip()]
        return [str(item).strip() for item in v if item]


@lru_cache()
def get_settings() -> Settings:
    """Return cached application settings instance."""
    return Settings()
