import os
import tempfile
from fastapi import WebSocket, WebSocketDisconnect
from fastapi.concurrency import run_in_threadpool

from .audio import transcode_to_wav_16k, AudioProcessingError
from .model import run_transcription
from .redaction import redact_segments, redact_text
from .config import get_settings

settings = get_settings()


class StreamSession:
    def __init__(self, websocket: WebSocket, claims: dict):
        self.ws = websocket
        self.claims = claims
        self.buffer = bytearray()

    async def add_chunk(self, data: bytes):
        self.buffer.extend(data)

    async def finalize(self):
        fd, raw_path = tempfile.mkstemp()
        os.close(fd)
        try:
            with open(raw_path, "wb") as f:
                f.write(self.buffer)
            wav_path, _ = await transcode_to_wav_16k(raw_path)
            result = await run_in_threadpool(run_transcription, wav_path)
            segments = result["segments"]
            text = result["text"]
            if settings.enable_redaction:
                segments = redact_segments(segments)
                text = redact_text(text)
            await self.ws.send_json(
                {
                    "type": "final",
                    "text": text,
                    "segments": segments,
                    "language": result["language"],
                    "processing_ms": result["processing_ms"],
                }
            )
        finally:
            try:
                os.remove(raw_path)
            except OSError:
                pass


async def websocket_endpoint(ws: WebSocket, claims: dict):
    await ws.accept()
    session = StreamSession(ws, claims)
    try:
        while True:
            msg = await ws.receive()
            if "bytes" in msg and msg["bytes"]:
                await session.add_chunk(msg["bytes"])
            elif msg.get("text") == "__end__":
                await session.finalize()
                break
            else:
                await ws.send_json({"type": "error", "detail": "Unsupported frame"})
    except WebSocketDisconnect:
        return
    finally:
        await ws.close()
