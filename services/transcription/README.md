# Transcription Service (Whisper)

FastAPI microservice providing medical-oriented transcription (batch + optional streaming) with PHI-aware redaction.

Implemented:
- /healthz liveness
- POST /v1/transcribe (multipart/form-data) – batch transcription with Whisper
- PHI redaction (basic regex) when ENABLE_REDACTION=true
- JWT auth (RS256 via JWKS) & simple Redis rate limiting
- WebSocket /v1/ws (final message only)

Planned Enhancements:
- Incremental streaming partials
- Advanced PHI redaction (NER/contextual)
- Metrics endpoint & structured logging

## Environment Variables
| Name | Required | Default | Description |
|------|----------|---------|-------------|
| MODEL_SIZE | no | base | Whisper model size (tiny/base/small/medium/large-v2) |
| DEVICE | no | cpu | Execution device (cpu) |
| ENABLE_REDACTION | no | false | Enable PHI redaction layer |
| MAX_AUDIO_SECONDS | no | 900 | Hard cap length for an upload (seconds) |
| JWT_ISSUER | yes | - | Expected token issuer |
| JWT_AUDIENCE | yes | - | Expected audience claim |
| JWKS_URL | yes | - | JWKS endpoint for RS256 verification |
| REDIS_URL | no | redis://redis:6379/0 | Rate limit + caching |
| LOG_LEVEL | no | info | Log verbosity |

## Run Locally
```
uvicorn app.main:app --reload --port 8085
```

## API Contract

### POST /v1/transcribe
Multipart form-data:
	file: audio/wav|audio/webm|audio/mpeg

Response 200:
```
{
	"filename": "sample.wav",
	"language": "en",
	"duration_seconds": 1.23,
	"model": "base",
	"processing_ms": 120,
	"redaction_applied": false,
	"text": "Hello world",
	"segments": [ {"id":0, "start":0.0, "end":0.9, "text":"Hello world"} ]
}
```
Errors: 400,401,413,429

### WebSocket /v1/ws
Send binary audio chunks followed by text frame `__end__`.
Receives one final JSON message with transcription.

### Redaction Caveats
Regex-based; not guaranteed to remove all PHI. Upgrade required for production compliance.

### Tests
Run: `pytest services/transcription/tests -q`

