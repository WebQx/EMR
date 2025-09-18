# WebQX In-Memory FHIR Mock

Status: Lightweight development aid (NOT for production)

## Purpose
Accelerate local frontend & workflow development without needing a full OpenEMR or external FHIR server. Provides volatile in-memory storage for a minimal subset of FHIR R4 resources.

## Enabling
```
USE_FHIR_MOCK=true
```
If disabled or unset, `/fhir/*` paths proxy to the real (local or remote) OpenEMR-backed FHIR endpoint.

## Implemented Resources
| Resource | Methods | Notes |
|----------|---------|-------|
| Patient | POST, GET /:id, GET search | Search supports `?name=` or `?family=` (contains match) |
| Appointment | POST, GET /:id, GET search | Search supports `?patient=` & `?date=` naive filters |

All create operations assign `id` via `crypto.randomUUID()` and attach `meta.created` timestamp.

## Bundle Format
Search and list responses follow:
```json
{
  "resourceType": "Bundle",
  "type": "searchset",
  "total": <count>,
  "entry": [ { "resource": { ... } } ]
}
```

## Example Usage
Create Patient:
```bash
curl -X POST http://localhost:3000/fhir/Patient \
  -H 'Content-Type: application/json' \
  -d '{"name":[{"text":"Jane Roe"}],"gender":"female"}'
```
Search Patients:
```bash
curl 'http://localhost:3000/fhir/Patient?name=Jane'
```
Create Appointment:
```bash
curl -X POST http://localhost:3000/fhir/Appointment \
  -H 'Content-Type: application/json' \
  -d '{"start":"2025-10-01T10:00:00Z","participant":[{"actor":{"reference":"Patient/123"}}]}'
```

## Limitations
- No update (`PUT`/`PATCH`) or delete operations yet
- No pagination, sorting, or conditional create
- No validation against full FHIR profiles
- Not persisted; restart clears all data
- No security model (intentionally open for dev convenience)

## Future Enhancements
| Item | Priority | Notes |
|------|----------|-------|
| Add Encounter & Observation | High | Support vitals & visit summaries |
| Simple $validate endpoint | Medium | Schema-level validation (subset) |
| Persistence toggle (file/SQLite) | Medium | Optional durability |
| Synthetic data seeding script | Low | Pre-populate sample patients |
| Role-based access (mock auth) | Medium | Gate writes by role claim |

## Testing Ideas
| Scenario | Expectation |
|----------|-------------|
| Create + Read Patient | 201 then 200 with matching id |
| Search by name substring | Returns bundle.total >= 1 |
| Appointment filter by patient | Only appointments referencing patient |
| Restart server | Previous resources gone |

## Migration Path
Once backend OpenEMR FHIR is stable for dev workflows, set `USE_FHIR_MOCK=false` to exercise real APIs with minimal code change.

---
_“Fast iteration today → safer production tomorrow.”_
