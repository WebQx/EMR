"""Shared RS256 JWT verification with JWKS caching.
Usage (FastAPI):

from services.shared.jwt_rs256 import JWTVerifier, VerifierSettings
settings = VerifierSettings(jwks_url=..., issuer=..., audience=...)
verifier = JWTVerifier(settings)

async def dependency(claims=Depends(verifier.verify)):
    return claims
"""
from __future__ import annotations
import time
from dataclasses import dataclass
from typing import Any, Dict, Optional

import httpx
from jose import jwt

@dataclass
class VerifierSettings:
    jwks_url: str
    issuer: str
    audience: str
    cache_ttl: int = 300

class JWKSCache:
    def __init__(self):
        self._data: Optional[Dict[str, Any]] = None
        self._fetched_at: float = 0.0

    def get(self) -> Optional[Dict[str, Any]]:
        return self._data

    def set(self, data: Dict[str, Any]):
        self._data = data
        self._fetched_at = time.time()

    def is_fresh(self, ttl: int) -> bool:
        return self._data is not None and (time.time() - self._fetched_at) < ttl

class JWTVerifier:
    def __init__(self, settings: VerifierSettings):
        self.settings = settings
        self.cache = JWKSCache()

    async def _fetch_jwks(self) -> Dict[str, Any]:  # pragma: no cover
        async with httpx.AsyncClient(timeout=5.0) as client:
            r = await client.get(self.settings.jwks_url)
            r.raise_for_status()
            return r.json()

    async def _get_jwks(self) -> Dict[str, Any]:
        if self.cache.is_fresh(self.settings.cache_ttl):
            return self.cache.get()  # type: ignore
        data = await self._fetch_jwks()
        self.cache.set(data)
        return data

    async def verify(self, authorization: Optional[str]) -> Dict[str, Any]:
        if not authorization or not authorization.lower().startswith("bearer "):
            raise ValueError("Missing bearer token")
        token = authorization.split(" ", 1)[1].strip()
        jwks = await self._get_jwks()
        headers = jwt.get_unverified_header(token)
        kid = headers.get("kid")
        key = next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)
        if not key:
            raise ValueError("Signing key not found")
        try:
            claims = jwt.decode(
                token,
                key,
                algorithms=[key.get("alg", "RS256")],
                audience=self.settings.audience,
                issuer=self.settings.issuer,
            )
        except Exception as e:  # pragma: no cover
            raise ValueError(f"Invalid token: {e}")
        return claims

__all__ = ["VerifierSettings", "JWTVerifier"]
