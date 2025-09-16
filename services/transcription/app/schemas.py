from pydantic import BaseModel, Field
from typing import List, Optional


class Segment(BaseModel):
    id: int
    start: float
    end: float
    text: str
    avg_logprob: float | None = None
    no_speech_prob: float | None = None
    temperature: float | None = None


class TranscriptionResponse(BaseModel):
    filename: str
    language: str
    duration_seconds: float
    model: str
    processing_ms: int
    redaction_applied: bool = Field(default=False)
    text: str
    segments: List[Segment]
