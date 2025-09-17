import os
from functools import lru_cache


class Settings:
    model_size: str = os.getenv("MODEL_SIZE", "base")
    device: str = os.getenv("DEVICE", "cpu")
    enable_redaction: bool = os.getenv("ENABLE_REDACTION", "false").lower() == "true"
    max_audio_seconds: int = int(os.getenv("MAX_AUDIO_SECONDS", "900"))  # 15 min default
    jwt_issuer: str | None = os.getenv("JWT_ISSUER")
    jwt_audience: str | None = os.getenv("JWT_AUDIENCE")
    jwks_url: str | None = os.getenv("JWKS_URL")
    redis_url: str | None = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    log_level: str = os.getenv("LOG_LEVEL", "info")


@lru_cache
def get_settings() -> Settings:  # pragma: no cover - simple accessor
    return Settings()
