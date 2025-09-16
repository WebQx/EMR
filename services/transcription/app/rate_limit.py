import time
import hashlib
from typing import Optional
import redis
from fastapi import HTTPException

from .config import get_settings

_redis_client: Optional[redis.Redis] = None


def get_client() -> Optional[redis.Redis]:  # pragma: no cover
    global _redis_client
    if _redis_client is None:
        settings = get_settings()
        try:
            _redis_client = redis.Redis.from_url(settings.redis_url, decode_responses=True)
        except Exception:
            _redis_client = None
    return _redis_client


def rate_limit(key: str, limit: int, window_sec: int) -> None:
    client = get_client()
    if client is None:
        return  # fail open if redis unavailable
    now_bucket = int(time.time() // window_sec)
    hashed = hashlib.sha256(key.encode()).hexdigest()[:32]
    redis_key = f"rl:{hashed}:{now_bucket}"
    pipe = client.pipeline()
    pipe.incr(redis_key, 1)
    pipe.expire(redis_key, window_sec)
    count, _ = pipe.execute()
    if count > limit:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
