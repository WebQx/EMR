# Patient Literacy Bot Service (Scaffold)

Purpose: Provide plain-language explanations, medication guidance, appointment prep instructions, and health education summaries tailored to reading level.

## Capabilities (Planned)
- Explain clinical terms in accessible language.
- Generate visit preparation checklists.
- Provide medication instructions with safety reminders.
- Summarize after-visit notes.

## Initial Endpoints
- `POST /v1/literacy/explain` -> Explain a medical term or phrase.
- `POST /v1/literacy/checklist` -> Appointment prep checklist.
- `POST /v1/literacy/medication` -> Medication usage summary.
- `GET /health` -> Liveness.

## Security
- JWT (RS256) verification planned (shared JWKS logic module).

## Roadmap
1. Add real model integration & retrieval.
2. Support language parameter & reading level.
3. Add caching for common explanations.
4. Add analytics + audit logging for compliance.
