"""
Centralized settings, loaded from .env via pydantic-settings.
Nothing else in the codebase should call os.environ directly for these values —
import `settings` from here instead, so there's exactly one place secrets flow through.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    xai_api_key: str = ""
    frontend_origin: str = "http://localhost:5173"
    # Confirm the current model ID in the xAI console before the hackathon starts —
    # xAI retires/redirects model slugs frequently. Use their fast/low-latency tier,
    # not the flagship reasoning model, for demo-time speed and cost control.
    grok_model: str = "grok-4-fast"
    grok_timeout_seconds: float = 8.0
    database_url: str = "sqlite:///./founderpilot.db"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()