import time
from typing import Any, Dict
import httpx
from jose import jwt
from fastapi import HTTPException, Header

from .config import get_settings

_JWKS_CACHE: Dict[str, Any] = {"keys": None, "fetched_at": 0}


async def _fetch_jwks():  # pragma: no cover - external call
    settings = get_settings()
    if not settings.jwks_url:
        raise RuntimeError("JWKS_URL not configured")
    async with httpx.AsyncClient(timeout=5.0) as client:
        r = await client.get(settings.jwks_url)
        r.raise_for_status()
        return r.json()


async def get_jwks():
    now = time.time()
    if _JWKS_CACHE["keys"] and now - _JWKS_CACHE["fetched_at"] < 300:
        return _JWKS_CACHE["keys"]
    data = await _fetch_jwks()
    _JWKS_CACHE["keys"] = data
    _JWKS_CACHE["fetched_at"] = now
    return data


async def verify_jwt(authorization: str = Header(None)) -> Dict[str, Any]:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.split(" ", 1)[1].strip()
    settings = get_settings()
    jwks = await get_jwks()
    unverified = jwt.get_unverified_header(token)
    kid = unverified.get("kid")
    key = None
    for k in jwks.get("keys", []):
        if k.get("kid") == kid:
            key = k
            break
    if not key:
        raise HTTPException(status_code=401, detail="Signing key not found")
    try:
        claims = jwt.decode(
            token,
            key,
            algorithms=[key.get("alg", "RS256")],
            audience=settings.jwt_audience,
            issuer=settings.jwt_issuer,
        )
    except Exception as e:  # pragma: no cover
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")
    return claims
