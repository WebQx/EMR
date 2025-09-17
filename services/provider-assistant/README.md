# Provider Assistant Service (Scaffold)

Lightweight microservice placeholder that will power clinical assistance features for providers (drafting notes, summarizing patient context, suggesting orders). This is an initial scaffold only.

## Goals
- Provide internal REST API surface for provider-facing assistance.
- Abstract model provider (LLM) behind capability endpoints.
- Enforce auth via platform-issued JWT (RS256 planned).
- Support future streaming responses.

## Tech (Proposed)
- FastAPI (Python) OR Node Express. (Started with FastAPI for parity with transcription service.)
- Pydantic models for request/response.
- Pluggable backend (OpenAI / local models / retrieval pipeline later).

## Endpoints (Initial Draft)
- `POST /v1/assist/summary` : Summarize patient chart (mock response now).
- `POST /v1/assist/plan` : Draft assessment & plan snippet.
- `POST /v1/assist/triage` : Classify urgency level.
- `GET /health` : Liveness.

## Security
- Accepts `Authorization: Bearer <jwt>` header (verification stub current; integrate JWKS module shared later).

## Next Steps
1. Implement JWT verification using existing auth service JWKS.
2. Add rate limiting & audit logging hooks.
3. Integrate retrieval of patient context via FHIR service.
4. Add streaming endpoint for incremental drafting.

See also patient literacy service scaffold in `services/patient-literacy/`.

