import io
import wave
import struct

import pytest
from app import main as main_module


def _sine_wav(duration_sec=0.2, freq=440.0, rate=16000):
    frames = int(duration_sec * rate)
    buf = io.BytesIO()
    with wave.open(buf, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(rate)
        import math
        for i in range(frames):
            val = int(32767 * 0.2 * math.sin(2 * math.pi * freq * i / rate))
            wf.writeframes(struct.pack('<h', val))
    buf.seek(0)
    return buf


def test_healthz(client):
    r = client.get('/healthz')
    assert r.status_code == 200
    assert 'model' in r.json()


def test_transcribe_success_mocked(client, monkeypatch):
    def fake_run(path):
        return {
            "language": "en",
            "duration": 0.2,
            "segments": [{"id": 0, "start": 0.0, "end": 0.2, "text": "hello world"}],
            "text": "hello world",
            "processing_ms": 5,
            "model_size": "base",
        }
    monkeypatch.setattr(main_module, "run_transcription", fake_run)
    audio = _sine_wav()
    files = {"file": ("test.wav", audio, "audio/wav")}
    r = client.post('/v1/transcribe', files=files)
    assert r.status_code == 200
    data = r.json()
    assert data['text'] == 'hello world'
    assert data['segments'][0]['text'] == 'hello world'


def test_rate_limit(client, monkeypatch):
    calls = {"n": 0}
    def fake_run(path):
        return {
            "language": "en",
            "duration": 0.2,
            "segments": [{"id": calls["n"], "start": 0.0, "end": 0.2, "text": f"seg {calls['n']}"}],
            "text": "dummy",
            "processing_ms": 1,
            "model_size": "base",
        }
    monkeypatch.setattr(main_module, "run_transcription", fake_run)

    def fake_rate_limit(key, limit, window_sec):
        if key == 'user:test-user':
            calls['n'] += 1
            if calls['n'] > 3:
                from fastapi import HTTPException
                raise HTTPException(status_code=429, detail='Rate limit exceeded')
    monkeypatch.setattr(main_module, "rate_limit", fake_rate_limit)

    audio = _sine_wav()
    files = {"file": ("t.wav", audio, "audio/wav")}
    for _ in range(3):
        r = client.post('/v1/transcribe', files=files)
        assert r.status_code == 200
    r = client.post('/v1/transcribe', files=files)
    assert r.status_code == 429


def test_websocket_flow(client, monkeypatch):
    def fake_run(path):
        return {
            "language": "en",
            "duration": 0.2,
            "segments": [{"id": 0, "start": 0.0, "end": 0.2, "text": "ws text"}],
            "text": "ws text",
            "processing_ms": 2,
            "model_size": "base",
        }
    monkeypatch.setattr(main_module, "run_transcription", fake_run)
    with client.websocket_connect('/v1/ws') as ws:
        ws.send_bytes(b'\x00\x01')
        ws.send_text('__end__')
        msg = ws.receive_json()
        assert msg['type'] == 'final'
        assert msg['text'] == 'ws text'


def test_redaction_unit():
    from app.redaction import redact_text
    text = "Patient John Smith MRN: ABCD123 Phone 555-123-4567"
    red = redact_text(text)
    assert '[PHONE]' in red or 'MRN [ID]' in red or '[NAME]' in red
