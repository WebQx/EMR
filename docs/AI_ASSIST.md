# WebQX AI Assist (Mock Phase)

Status: Prototype (Mock responses only)  
Endpoints Base: `/api/ai`

## Overview
The AI Assist feature provides structured clinical support outputs (Summary, Plan, Triage, Education) from encounter context (transcripts, notes, problem list). Current implementation is a deterministic mock for rapid UI + workflow integration while the production inference pipeline is designed.

## Current Endpoint
`POST /api/ai/summary`

Request Schema (Zod):
```
patientId: string (required)
mode: 'summary' | 'plan' | 'triage' | 'education' (default 'summary')
transcript?: Array<{ speaker: string; text: string }>
notes?: string
problems?: string[]
```

Example Request:
```json
{
  "patientId": "demo-123",
  "mode": "plan",
  "problems": ["headache", "insomnia"],
  "transcript": [ { "speaker": "patient", "text": "My headaches are better." } ]
}
```

Example Response (plan mode excerpt):
```json
{
  "patientId": "demo-123",
  "mode": "plan",
  "model": "webqx-ai-mock-1",
  "disclaimer": "AI mock output. Not for clinical use.",
  "output": {
    "carePlan": ["Track headache frequency daily", "Introduce stretching"],
    "tasks": [ { "type": "follow-up", "due": "2025-10-15" } ]
  }
}
```

## Feature Flag
`AI_ASSIST_ENABLED=true` (default)  
Set to `false` to disable mounting of `/api/ai` routes.

## Roadmap Phases
| Phase | Focus | Deliverables |
|-------|-------|--------------|
| 0 | Mock | Current deterministic JSON outputs |
| 1 | Local Embeddings | Lightweight summarizer + section classifier |
| 2 | Streaming | Real-time partial SOAP sections (Server-Sent Events) |
| 3 | Clinical Models | ICD-10, SNOMED concept suggestions, Rx normalization |
| 4 | Guardrails | PHI redaction, hallucination scoring, citation provenance |
| 5 | Inline UX | Structured edit/accept diff workflow in provider UI |

## Planned Production Pipeline
1. Ingest encounter transcript chunks (WebRTC / WebSocket)  
2. Real-time diarization & section tagging (Subjective / Objective cues)  
3. Incremental summarization with rolling context window  
4. Terminology normalization (RxNorm, SNOMED CT)  
5. Output gating (compliance filters + risk heuristics)  
6. Provider acceptance & versioned audit persistence

## Security & Compliance (Target)
- All PHI processing confined to region-specific inference nodes
- Deterministic logs of prompt + model hash with tamper-evident chain
- Optional local-only mode (edge summarizer) for high-sensitivity deployments

## Integration Notes
- Responses always include `disclaimer` during mock/alpha phases
- UI should surface mode toggle (Summary / Plan / Triage / Education)
- For streaming expansion: plan to shift endpoint to `/api/ai/summary/stream` (SSE)

## Testing Suggestions
| Case | Input | Expect |
|------|-------|-------|
| Missing patientId | `{}` | 400 with validation issues |
| Default mode | patientId only | `mode: "summary"` in response |
| Plan mode | mode=plan | `carePlan` & `tasks` present |
| Triage mode | mode=triage | `acuity` + `escalationCriteria` |

## Future Metrics
- Latency (p50/p95) per mode
- Acceptance rate of suggested care plan tasks
- Term normalization precision (post Phase 3)

---
_“Augment clinicians, never replace them.”_
