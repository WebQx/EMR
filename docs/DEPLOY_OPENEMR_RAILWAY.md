# Deploying OpenEMR for WebQX EMR on Railway

This guide explains how to run a managed OpenEMR instance on Railway and connect the WebQX Unified Gateway in **remote mode**.

## 1. Overview
Instead of spawning a local integration server, WebQX can proxy FHIR & core OpenEMR API traffic to a remote hosted OpenEMR (Railway). Enable via environment variables:
```
USE_REMOTE_OPENEMR=true
OPENEMR_REMOTE_URL=https://your-railway-openemr.app
```
The healthcare platform gateway will:
- Skip local OpenEMR process startup
- Mark OpenEMR health as ready
- Proxy `/api/openemr/*` → `<OPENEMR_REMOTE_URL>/api/v1/openemr/*`
- Proxy `/fhir/*` → `<OPENEMR_REMOTE_URL>/fhir/*`

## 2. Railway Deployment Steps
1. Fork an OpenEMR container image or use a maintained image (ensure licensing compliance).
2. Create a new Railway project → Deploy Docker image.
3. Set Railway service variables (examples):
   - `TZ=UTC`
   - `MYSQL_HOST=<railway-mysql-host>`
   - `MYSQL_USER=<user>`
   - `MYSQL_PASSWORD=<password>`
   - `MYSQL_DATABASE=openemr`
4. Ensure persistent storage (Railway volume) is attached for `/var/www/localhost/htdocs/openemr/sites` and uploaded assets.
5. Expose HTTP port (default container port 80) → Railway generates public URL.
6. Run initial OpenEMR setup wizard (one-time) to finalize configuration.

## 3. Security Considerations
| Area | Recommendation |
|------|---------------|
| Transport | Enforce HTTPS (Railway managed cert) |
| Admin Access | Restrict /interface/main/tabs/users/ via VPN / IP allow where possible |
| Database | Use Railway managed MySQL with strong credentials & limited network exposure |
| PHI Logging | Disable verbose access logs for protected data routes |
| Backups | Schedule MySQL dumps or Railway backup add-on |
| Updates | Track OpenEMR security releases; rebuild image promptly |

## 4. Environment Variables (Gateway)
Add to WebQX runtime environment (`.env` or hosting config):
```
USE_REMOTE_OPENEMR=true
OPENEMR_REMOTE_URL=https://your-railway-openemr.app
```
Optional tuning:
```
OPENEMR_TIMEOUT_MS=10000
FHIR_PROXY_STRICT=true
```
(These are not yet implemented—placeholders for future hardening.)

## 5. Local Development Toggle
To switch back to local mode, unset or set:
```
USE_REMOTE_OPENEMR=false
```
The healthcare platform gateway will again spawn the embedded `openemr-server.js` integration layer.

## 6. Health & Observability
- The gateway `/health` marks `openemr: true` immediately in remote mode (optimistic). Future enhancement: active probe to `OPENEMR_REMOTE_URL/fhir/metadata` before marking ready.
- Add an uptime cron or external monitor (e.g., Better Stack) against `/fhir/metadata` remotely.

## 7. Future Enhancements
| Feature | Description |
|---------|-------------|
| Remote Probe | Validate FHIR CapabilityStatement before ready=true |
| Auth Gateway | Token exchange / SMART-on-FHIR style auth proxy |
| Caching Layer | ETag/If-Modified-Since caching for FHIR reads |
| Circuit Breaker | Trip after consecutive remote failures; degrade gracefully |
| Metrics | Collect latency histogram per route |

## 8. Troubleshooting
| Symptom | Action |
|---------|--------|
| 503 OpenEMR proxy error | Check `OPENEMR_REMOTE_URL` correctness & CORS responses |
| FHIR 404 on metadata | Ensure remote server exposes `/fhir/metadata` |
| Setup wizard shows again | Railway volume not persisted—reconfigure storage |
| Slow responses | Add Railway plan resources or enable DB indexing |

---
Questions or improvements? Open a PR with `docs:` prefix.
