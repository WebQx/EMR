import re
from typing import List


_PHONE = re.compile(r"\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?){1}\d{3}[-.\s]?\d{4}\b")
_MRN = re.compile(r"\bMRN[:\s]*([A-Z0-9-]{5,})\b", re.IGNORECASE)
_NAME = re.compile(r"\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b")


def redact_text(text: str) -> str:
    """Very naive PHI redaction placeholder. Replace with deterministic tokens.
    This will be improved in later steps."""
    redacted = _PHONE.sub("[PHONE]", text)
    redacted = _MRN.sub("MRN [ID]", redacted)
    # Limit name replacements to first 10 to reduce false positives
    def _name_sub(match):
        return "[NAME]"
    count = 0
    def repl(m):  # pragma: no cover - simple wrapper
        nonlocal count
        if count > 10:
            return m.group(0)
        count += 1
        return _name_sub(m)
    redacted = _NAME.sub(repl, redacted)
    return redacted


def redact_segments(segments: list[dict]) -> list[dict]:
    return [
        {**seg, "text": redact_text(seg.get("text", ""))}
        for seg in segments
    ]
