# Transcription Service Deployment (Railway)

## Setup Steps
1. Create a new Railway service using the Dockerfile at `services/transcription/Dockerfile`.
2. Add environment variables:
   - MODEL_SIZE=base
   - ENABLE_REDACTION=true
   - JWT_ISSUER=https://auth.example.com/
   - JWT_AUDIENCE=webqx-api
   - JWKS_URL=https://auth.example.com/.well-known/jwks.json
   - REDIS_URL=redis://<redis-host>:6379/0
   - MAX_AUDIO_SECONDS=900
   - LOG_LEVEL=info
3. Set health check to GET /healthz
4. Scale: start with 1 instance (1x CPU, 1GB RAM). Monitor p95 latency.

## Scaling Guidelines
| Model | Approx RAM (int8) | Notes |
|-------|-------------------|-------|
| tiny  | ~0.4 GB | Lower accuracy |
| base  | ~0.6 GB | Balanced default |
| small | ~1.2 GB | Better medical term capture |

## Security
- Enforce short-lived tokens (<=15m) and rotate keys.
- Reject > MAX_AUDIO_SECONDS early.
- Consider upstream gateway for additional WAF/rate limiting.

## Future Improvements
- Partial streaming chunks
- Prometheus metrics endpoint
- Advanced PHI entity classification
