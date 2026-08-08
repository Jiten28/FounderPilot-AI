"""
Centralized settings, loaded from .env via pydantic-settings.
Nothing else in the codebase should call os.environ directly for these values —
import `settings` from here instead, so there's exactly one place secrets flow through.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    groq_api_key: str = ""
    frontend_origin: str = "http://localhost:5173"
    # Confirm the current model ID at https://console.groq.com/docs/models —
    # Groq occasionally retires/renames model slugs. llama-3.3-70b-versatile was
    # deprecated by Groq on 2026-06-17 with a shutdown date of 2026-08-16 (see
    # https://console.groq.com/docs/deprecations); requests to it will start
    # returning errors on that date. Using openai/gpt-oss-120b instead — Groq's
    # recommended replacement, free tier, fast, and still supports
    # response_format=json_object.
    groq_model: str = "openai/gpt-oss-120b"
    groq_timeout_seconds: float = 8.0
    database_url: str = "sqlite:///./founderpilot.db"

    # extra="ignore": if backend/.env accidentally still has frontend-only vars
    # (e.g. VITE_API_BASE_URL, copy-pasted from the shared .env.example without
    # trimming), don't crash the whole server over it — just ignore them.
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()