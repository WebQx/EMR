# WebQX EMR Vision & Roadmap

_Last updated: 2025-09-17_

## 1. Product Narrative
WebQX EMR is a modernized, AI-augmented evolution of the open-source OpenEMR platform—reimagined for real-time care coordination, multimodal clinical workflows, and global telemedicine access. The objective is to deliver a clinician-first user experience that unifies:

- Core Electronic Medical Record (EHR) functionality (patient charts, encounters, scheduling, orders, prescriptions)
- FHIR R4 interoperability and structured data exchange
- Ambient intelligence (clinical summarization, decision support, care plan assistance)
- Secure, low-latency telehealth & telepsychiatry sessions with session context continuity
- Whisper-based speech-to-text transcription & encounter note scaffolding
- Cross-device delivery (desktop, tablet, mobile, low-bandwidth contexts) with resilient offline fallbacks

## 2. Differentiators
| Theme | Differentiator | Why It Matters |
|-------|---------------|----------------|
| UX Modernization | Modular provider & patient portals with responsive cards | Reduces cognitive load & navigation fatigue |
| AI Integration | Inline summarization & structured extraction from notes | Accelerates documentation & improves consistency |
| Multimodal Input | Real-time Whisper transcription with speaker role tagging | Converts ambient speech into actionable structured data |
| Telehealth Fusion | Embedded telehealth & telepsychiatry panels sharing patient context | Eliminates app switching; supports continuity of care |
| Offline Resilience | Local cache & progressive enhancement (service workers) | Enables intermittent connectivity workflows |
| Interoperability | FHIR R4 capability statement & proxy routing | Plug-in integration with external health networks |
| Extensibility | Modular launcher (openEMRLauncher → future webqxLauncher) | Allows incremental migration without regressions |

## 3. Current State Snapshot
| Domain | Status (Sep 2025) | Notes |
|--------|------------------|-------|
| Auth & JWT | ✅ Basic register/login & token issuance | Strengthen MFA & session revocation next |
| FHIR Proxy | ✅ CapabilityStatement served; basic routing | Add resource CRUD scaffolds (Patient, Appointment) |
| Telehealth | ✅ Demo server + real-time signaling | Expand to multi-party + QoS metrics |
| Provider Portal | ✅ Modern card UI, launcher integration | Centralize branding (in progress) |
| Patient Portal | ✅ Hybrid page + React mount | Add secure messaging & visit prep |
| Branding | ✅ User-facing rebrand underway | Add centralized config (planned) |
| AI / Summaries | 🚧 Placeholder only | Whisper + summarization pipeline roadmap below |
| Transcription | 🚧 Not yet wired | Planned mock service first |
| Compliance Logging | ⚠️ Minimal | Need audit log + PHI access trails |

## 4. Near-Term Roadmap (0–60 days)
1. Centralized branding & configuration constants.
2. Whisper transcription microservice stub + API contract.
3. AI summarization pipeline (ingest raw transcript → segment → summarize → structured fields extraction).
4. Extend FHIR proxy: implement READ + SEARCH for Patient & Appointment (mock datastore initially).
5. Telehealth context sync: pass active patient + encounter ID into session metadata.
6. Provider portal: add "AI Assist" panel for summary, plan, triage (connect to placeholder). 
7. Security: rate limit refinements, JWT rotation endpoint, basic audit log sink.

## 5. Whisper Transcription Pipeline (Planned)
Flow:
1. Client streams audio chunks (WebRTC or MediaRecorder) → /api/transcription/stream (future) or uploads file to /api/transcription/upload.
2. Service buffers → sends to Whisper (local inference or remote API).
3. Partial segments emitted via SSE/WebSocket.
4. Final transcript stored + optionally aligned with encounter.
5. AI post-processor generates:
   - Encounter Summary (SOAP style)
   - Problem List Deltas
   - Medication Mentions
   - Follow-up Tasks / Reminders

Initial Increment (MVP): single POST `/api/transcription/mock` returning static structured transcript + summary.

## 6. Data & Integration Model
- Core Entities: User, Patient, Encounter, Appointment, Transcript, AIInsight, TelehealthSession.
- FHIR Mapping: Patient ↔ Patient, Appointment ↔ Appointment, Transcript ↔ DocumentReference (future), AIInsight ↔ DetectedIssue / Observation (selective).
- Event Bus (future): Emission of domain events (`transcription.completed`, `telehealth.started`, `ai.summary.generated`).

## 7. Architecture (Conceptual)
```
[ Browser / Device ]
   |  (HTTPS/WebRTC)
   v
[Unified Gateway / unified-server.js]
   - Auth proxy (/api/auth/*)
   - FHIR proxy (/fhir/*)
   - Telehealth signaling (/api/telehealth/*)
   - Transcription API (/api/transcription/*) ← (new)
   - Static assets / portals
        |                |                 |
        v                v                 v
 [Auth Service]   [FHIR Integration]   [Telehealth Server]
        |                |                 |
        +------ Shared JWT / Session Context -----+
        |
  [Future AI + Transcription Service]
```

Remote OpenEMR Mode: When `USE_REMOTE_OPENEMR=true`, the gateway skips spawning the local integration server and proxies `/api/openemr/*` and `/fhir/*` directly to `OPENEMR_REMOTE_URL` (e.g., a Railway-deployed OpenEMR instance). Health is optimistic pending future active probing of `/fhir/metadata`.

## 8. Security & Compliance Roadmap
| Area | Planned Improvements |
|------|----------------------|
| Authentication | MFA enrollment, refresh tokens, session revocation list |
| Authorization | Role claims refinement, scope-based filtering |
| Audit Logging | Append-only log of PHI access & admin actions |
| Data Minimization | Field-level redaction in logs & analytics |
| Encryption | At-rest encryption for transcripts & AI outputs |
| Input Hardening | Strict schema validation (zod / joi) & sanitization |

## 9. AI Assist UX Concepts
- Context-aware prompt assembly from: active patient, last encounter note, top problems, med list.
- Output modes: Summary | Plan | Triage | Education.
- Confidence indicators + disclaimers for clinical safety.

## 10. Incremental Migration Strategy
Maintain dual identity temporarily: underlying OpenEMR modules accessible while WebQX EMR UX overlays & enhances. Gradually:
1. Abstract launcher wrapper (webqxLauncher) around openEMRLauncher.
2. Replace direct FHIR calls with domain service adapters.
3. Progressive refactor of legacy PHP surfaces into Node-based microservices.

## 11. Success Metrics (Initial)
| Metric | Target |
|--------|--------|
| Average time to document encounter | ↓ 30% using AI assist |
| Telehealth session setup latency | < 5s 95th percentile |
| Mobile portal page interactive | < 3s on 3G |
| Transcript accuracy (clinical terms) | > 90% baseline |
| FHIR read response p95 | < 400ms |

## 12. Open Questions
- Local vs hosted Whisper inference path (cost vs latency)?
- PHI handling classification—where to tokenize/de-identify?
- Governance model for AI model updates & drift monitoring?

## 13. Next Implementation Steps (Proposed)
1. Implement `/api/transcription/mock` (static payload) → integrate button in provider portal (gated).
2. Add AI Assist panel wiring to placeholder endpoint `/api/ai/summary` (future stub).
3. Introduce simple in-memory store for transcripts + insights.
4. Add Jest tests for transcription endpoint contract.

---
This document will evolve alongside architectural commits. PRs welcome (`docs:` prefix for updates).
