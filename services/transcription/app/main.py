from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, WebSocket
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.concurrency import run_in_threadpool
import tempfile
import shutil
import os
import logging
import asyncio  # noqa: F401 (reserved for future streaming improvements)

from .config import get_settings
from .audio import transcode_to_wav_16k, AudioProcessingError
from .model import run_transcription
from .redaction import redact_segments, redact_text
from .schemas import TranscriptionResponse, Segment
from .auth import verify_jwt
from .rate_limit import rate_limit
from .websocket import websocket_endpoint

settings = get_settings()

logging.basicConfig(level=settings.log_level.upper())
logger = logging.getLogger("transcription")

app = FastAPI(title="Transcription Service", version="0.2.0")

cors_origins_env = os.getenv("TRANSCRIPTION_ALLOWED_ORIGINS")
if cors_origins_env:
    if cors_origins_env.strip() == "*":
        allow_origins = ["*"]
    else:
        allow_origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()]
else:
    allow_origins = ["http://localhost:3000", "http://localhost:8080", "https://webqx.github.io"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/healthz")
async def healthz():
    return {"status": "ok", "model": settings.model_size}


@app.get("/health")
async def health_alias():
    """Alias for platform health probes expecting /health."""
    return {"status": "ok", "model": settings.model_size}


@app.post("/v1/transcribe", response_model=TranscriptionResponse)
async def transcribe(file: UploadFile = File(...), claims: dict = Depends(verify_jwt)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename required")

    # Persist upload to temp file first
    tmp_fd, tmp_in_path = tempfile.mkstemp()
    os.close(tmp_fd)
    try:
        with open(tmp_in_path, "wb") as out_f:
            shutil.copyfileobj(file.file, out_f)
        # Transcode
        try:
            wav_path, duration = await transcode_to_wav_16k(tmp_in_path)
        except AudioProcessingError as e:
            logger.exception("Audio processing failed")
            raise HTTPException(status_code=400, detail=str(e))
        if duration > settings.max_audio_seconds:
            raise HTTPException(status_code=413, detail=f"Audio too long (>{settings.max_audio_seconds}s)")
        # Rate limit
        sub = claims.get("sub", "anon")
        try:
            rate_limit(f"user:{sub}", limit=20, window_sec=60)
            rate_limit("global:transcribe", limit=200, window_sec=60)
        except HTTPException as rl_exc:
            raise rl_exc
        # Run model (blocking) in thread pool
        result = await run_in_threadpool(run_transcription, wav_path)
        segments = result["segments"]
        text = result["text"]
        redaction_applied = False
        if settings.enable_redaction:
            segments = redact_segments(segments)
            text = redact_text(text)
            redaction_applied = True
        response = TranscriptionResponse(
            filename=file.filename,
            language=result["language"],
            duration_seconds=result["duration"],
            model=result["model_size"],
            processing_ms=result["processing_ms"],
            redaction_applied=redaction_applied,
            text=text,
            segments=[Segment(**s) for s in segments],
        )
        return JSONResponse(response.model_dump())
    finally:
        try:
            os.remove(tmp_in_path)
        except OSError:
            pass
        # wav file removed in model module? we created it - cleanup
        # We could search for leftover temp wav but rely on OS tmp cleaner.


@app.websocket("/v1/ws")
async def ws_endpoint(ws: WebSocket, claims: dict = Depends(verify_jwt)):
    await websocket_endpoint(ws, claims)

