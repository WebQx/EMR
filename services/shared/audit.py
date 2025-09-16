"""Simple asynchronous audit logger.

Writes JSON lines to a target file (default: audit.log). Intended for lightweight
compliance trace—NOT a full SIEM. Can be extended with async queue + rotation.
"""
from __future__ import annotations
import json
import time
import threading
from dataclasses import dataclass, asdict
from pathlib import Path
from queue import Queue, Empty
from typing import Any, Optional


@dataclass
class AuditEvent:
    ts: float
    actor: Optional[str]
    action: str
    resource: Optional[str] = None
    outcome: str = "success"
    ip: Optional[str] = None
    details: Optional[dict] = None


class AuditLogger:
    def __init__(self, path: str = "audit.log", flush_interval: float = 2.0):
        self.path = Path(path)
        self.flush_interval = flush_interval
        self._q: Queue[AuditEvent] = Queue()
        self._stop = threading.Event()
        self._thread = threading.Thread(target=self._worker, daemon=True)
        self._thread.start()

    def _worker(self):  # pragma: no cover - background thread
        buffer: list[str] = []
        while not self._stop.is_set():
            try:
                evt = self._q.get(timeout=self.flush_interval)
                buffer.append(json.dumps(asdict(evt), separators=(",", ":")))
            except Empty:
                pass
            if buffer:
                self.path.parent.mkdir(parents=True, exist_ok=True)
                with self.path.open("a", encoding="utf-8") as f:
                    f.write("\n".join(buffer) + "\n")
                buffer.clear()

    def log(self, action: str, actor: Optional[str] = None, **kwargs: Any):
        evt = AuditEvent(ts=time.time(), actor=actor, action=action, **kwargs)
        self._q.put(evt)

    def shutdown(self):  # pragma: no cover
        self._stop.set()
        self._thread.join(timeout=1.5)


_global_logger: Optional[AuditLogger] = None


def get_audit_logger() -> AuditLogger:
    global _global_logger
    if _global_logger is None:
        _global_logger = AuditLogger()
    return _global_logger


__all__ = ["get_audit_logger", "AuditLogger", "AuditEvent"]
