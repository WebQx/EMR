from __future__ import annotations
import time
from typing import Any, Dict, List
from functools import lru_cache

from faster_whisper import WhisperModel  # type: ignore

from .config import get_settings


@lru_cache
def get_model() -> WhisperModel:
    settings = get_settings()
    # For CPU we can use int8 to reduce memory; allow override with MODEL_COMPUTE_TYPE
    compute_type = "int8" if settings.device == "cpu" else "float16"
    return WhisperModel(
        settings.model_size,
        device=settings.device,
        compute_type=compute_type,
    )


def run_transcription(wav_path: str) -> Dict[str, Any]:
    """Run Whisper transcription returning structured data.
    Returns a dict containing language, segments list, and concatenated text."""
    model = get_model()
    started = time.time()
    segments_iter, info = model.transcribe(
        wav_path,
        beam_size=5,
        best_of=5,
        vad_filter=True,
        temperature=[0.0, 0.2, 0.4],
    )
    segments: List[Dict[str, Any]] = []
    full_text_parts: List[str] = []
    for idx, seg in enumerate(segments_iter):
        item = {
            "id": idx,
            "start": seg.start,
            "end": seg.end,
            "text": seg.text.strip(),
            "avg_logprob": getattr(seg, "avg_logprob", None),
            "no_speech_prob": getattr(seg, "no_speech_prob", None),
            "temperature": getattr(seg, "temperature", None),
        }
        segments.append(item)
        full_text_parts.append(item["text"])
    processing_ms = int((time.time() - started) * 1000)
    return {
        "language": info.language,
        "duration": info.duration,
        "segments": segments,
        "text": " ".join(full_text_parts).strip(),
        "processing_ms": processing_ms,
        "model_size": get_settings().model_size,
    }
