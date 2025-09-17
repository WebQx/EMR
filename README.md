# WebQX™ Healthcare Platform

> Cloud-based, FHIR-compliant, global healthcare ecosystem with OpenEMR integration

![WebQX CI & Deployment](https://github.com/${GITHUB_REPOSITORY:-webqx/webqx}/actions/workflows/deploy.yml/badge.svg)

## 🌍 Live Demo
**GitHub Pages:** https://webqx.github.io/webqx/  
**OpenEMR Instance:** https://fuzzy-goldfish-7vx645x7wgvv3rjxg-8085.app.github.dev

---

## ✨ Features

### 🏥 **OpenEMR 7.0.3 Integration**
- Fully branded WebQX EMR system
- Complete patient management
- Clinical workflows and documentation
- HIPAA compliant with audit trails

### 👤 **Patient Portal**
- Secure patient access to medical records
- Appointment scheduling and management
- Prescription tracking and refills
- Lab results and imaging access

### 👨‍⚕️ **Provider Portal**
- Complete clinical workflow management
- EHR integration with OpenEMR
- Clinical decision support tools
- Documentation and billing integration

### ⚙️ **Admin Console**
- System administration and configuration
- User management and role-based access
- Integration monitoring and maintenance
- Compliance reporting and audit logs

### 🌐 **Global Telehealth**
- 24/7 emergency consultations
- Scheduled virtual appointments
- Crisis intervention and support
- Multi-language support
- Care Navigation (D3.js/Neo4j)

### Provider Panel
- EHR Dashboard (React + GraphQL)
- Prescription Management (RxNorm + SmartRx)
- Secure Messaging (Matrix channels)
- Clinical Alerts/Decision Support (OpenCDS/Drools)
- CME Tracker (Open Badges)
- Provider Assistant Bot (LLM + Whisper)
- Transcription Suite (Whisper + Google Speech-to-Text)

### Admin Console
- Access Control (Keycloak/Firebase)
- Localization (i18next + Whisper)
- UI Theming (Tailwind/CSS-in-JS)
- Analytics (Grafana/Metabase)
- AI Tuning (YAML configs)
- Integration Engine (HL7/FHIR + OHIF PACS)
- Billing Logic (JSON rules)
- Compliance Modules (PostgreSQL + Vault)

### Telehealth
- Video Consultations (HIPAA-compliant)
- Real-Time Chat (encrypted)
- Remote Monitoring (IoT)
- Electronic Prescriptions
- Appointment Scheduling

---

## 🧑‍⚕️ MUP Access Program

Free/sponsored access for clinics serving Medically Underserved Populations.

**Eligibility:**
- Rural/tribal health centers
- Refugee/humanitarian clinics
- Disability/elder care facilities
- Low-income urban clinics

📥 [Apply for Equity Access](https://webqx.healthcare/equity-access)

---

## 🧱 Architecture Overview

```plaintext
[PWA Client] → [API Gateway] → [Microservices] → [PostgreSQL / FHIR DB]
```
- Authentication: OAuth2/Keycloak
- Adapter Plugins: OpenEMR, Epic, Cerner, etc.
- API Gateway: FHIR endpoints
- Session Control: Stateless tokens, audit trails
- Frontend: React dashboard
- Multilingual: i18n-ready UI

---

## 📁 Directory Structure

```plaintext
webqx-ehr/
├── modules/                  # Specialty modules & transcription
├── sso/                     # SSO (OAuth2/SAML)
├── ehr-integrations/        # EHR integrations
├── auth/                    # Authentication & access control
├── interoperability/        # HL7 FHIR, openEHR
├── messaging/               # Matrix messaging
└── docs/                    # Legal, contribution, IP
```

---

## 🏥 Interoperability

- Seamless EHR data exchange (OpenEMR, Epic, Cerner)
- HL7/FHIR via Mirth Connect
- Multilingual support

---

## 🧬 Supported Specialties

Primary Care, Radiology, Cardiology, Pediatrics, Oncology, Psychiatry, Endocrinology, Orthopedics, Neurology, Gastroenterology, Pulmonology, Dermatology, OBGYN

---

## 🛡️ Security & Compliance

- TLS encryption
- Audit-ready backend
- NDA & IP templates
- BAA readiness (HIPAA)

**Regulatory Coverage:**
| Country          | Protocols                 |
|------------------|--------------------------|
| 🇺🇸 US            | HIPAA, HITECH            |
| 🇪🇺 EU            | GDPR, ePrivacy           |
| 🇨🇦 Canada        | PIPEDA, PHIPA            |
| 🇮🇳 India         | DISHA, NDHM              |
| 🇧🇷 Brazil        | LGPD                     |
| 🇿🇦 South Africa  | POPIA                    |
| 🇵🇰 Pakistan      | PHIM, HIPC               |
| 🇦🇪 UAE           | DHA, DoH Data Law        |
| 🇸🇦 Saudi Arabia  | NHIC, PDPL               |

---

## 🧪 Lab Results Integration

- HL7 v2 → FHIR R4 via Mirth Connect
- Real-time lab results, filtering, sorting
- Security: TLS, HIPAA, audit logging

---

## 🩺 ChatEHR Integration

- Real-time messaging, appointment sync, dashboards
- Security: AES-256-GCM, audit logging, RBAC

---

## 🚀 Deployment

- AWS Lambda: Automated packaging, optimized dependencies
- Railway: Zero-config deployment, health monitoring
- Local: Mock FHIR/openEHR servers

---

## 🤝 Contribution Guide

- Fork, suggest specialty workflows
- Sign IP Addendum/NDA before PR
- Use feature branches, submit YAML logic + compliance notes

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) and [`specialties.yaml`](./admin-console/ai-tuning/specialties.yaml)

---

## 📜 License

Apache 2.0 — Contributor IP addendums for legal clarity and scalability  
See [`LICENSE.md`](./LICENSE.md), [`nda-template.md`](./legal/nda-template.md), [`ip-addendum.md`](./legal/ip-addendum.md)

---

## 🆕 2025 Landing Page Refresh

On 2025-09-14 the root landing page was redesigned for a simpler, modern experience:

- Replaced long-form marketing layout with concise hero + value props
- Added accessibility improvements (landmarks, aria labels, focus rings, reduced motion-friendly minimalism)
- Direct module launch cards (Patient / Provider / Telehealth / Admin) with existing auth + status integration
- Live snapshot + community stats placeholders fed by `webqx-remote-config.js` + `integrations/github-pages-integration-patch.js`
- Preserved old page as `index.legacy.html` for rollback and reference

No build or script changes required—new page reuses `assets/webqx-styles.css` glass / gradient utilities and layers minimal inline styles.

To revert: rename `index.legacy.html` back to `index.html` or selectively merge sections.

### 2025-09-16 Minimal Role-Based Landing Update

The marketing-style landing has now been replaced with a minimal access gateway (`index.html`) focused purely on role entry:

* Four role tiles (Patient / Provider / Admin / Telehealth)
* Inline demo credentials with copy-to-clipboard buttons
* Dynamic backend environment tag (Railway aware via `webqx-remote-config.js`)
* No emojis, low cognitive load, theme tokens applied
* Dark-mode toggle with persistence (`localStorage: wqx-theme`)

Previous feature-rich landing retained via git history (no separate legacy file for this second iteration).

## 🎨 Theme System

New calming healthcare theme introduced:

* Source: `assets/webqx-emr-theme.css`
* Auto attach: `assets/webqx-theme-init.js`
* Shared tokens: spacing, radii, colors (light/dark), shadows, buttons, nav
* Accessible focus ring (`--wqx-focus`), reduced motion friendly
* Portals updated (patient, provider, admin) with consistent top bar + dark toggle

## 🤖 Provider Assistant Scaffold

Directory: `services/provider-assistant/`

FastAPI microservice placeholder (not yet wired into gateway):

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Liveness |
| `POST /v1/assist/summary` | Draft chart summary (mock) |
| `POST /v1/assist/plan` | Draft assessment/plan snippet |
| `POST /v1/assist/triage` | Naive urgency classification |

Authentication stub currently accepts any token; integrate RS256 JWT + JWKS soon.

## 🧪 End-to-End Test (Playwright)

Added basic e2e coverage for landing role tiles & copy action:

File: `tests/e2e/role-access.spec.ts`

Run after installing dev deps:
```
npm install
npx playwright install --with-deps  # optional for browsers
npm run test:e2e
```

CI integration pending; can be added as a separate GitHub Actions job.

---

## 🔐 Django Authentication Integration (Phase 1)

The platform now supports using the Django backend as the primary Identity Provider (IdP) for the PHP/OpenEMR EMR stack.

Phase 1 Summary:
- Added `django-auth` service to `webqx-emr-system/docker-compose.yml` (exposed on host port 8090, internal 8000)
- Reverse proxy `/auth/` path through Apache inside `webqx-emr` → Django (see `docker/apache/webqx-site.conf`)
- Implemented HS256 JWT validation in PHP (`api/auth/jwt_validator.php`) and session bridge (`api/auth/session_bridge.php`)
- Auto-inclusion in `api/webqx-api.php` to hydrate OpenEMR session context from JWT claims

Environment Variables (examples):
```
DJANGO_SECRET_KEY=webqx_shared_dev_secret_change_me
DJANGO_JWT_SHARED_SECRET=webqx_shared_dev_secret_change_me
DJANGO_JWT_ISSUER=webqx.healthcare
DJANGO_JWT_AUDIENCE=webqx.emr
```

Local Test Flow:
1. Start stack: `docker compose up -d --build` inside `webqx-emr-system`.
2. Obtain JWT from Django (e.g., `POST /auth/api/token/` with user credentials).
3. Call EMR API with `Authorization: Bearer <token>` header.
4. Session bridge populates `$_SESSION` keys and grants access.

Next Phases (Optional):
- RS256 keypair + JWKS endpoint
- Token revocation via blacklist introspection
- Role synchronization & provisioning mapping into OpenEMR-specific tables
- Refresh token rotation in HttpOnly cookie path

Security Notes:
- Do not reuse `DJANGO_SECRET_KEY` in production as a JWT shared secret—switch to asymmetric signing.
- Restrict `/auth/` proxy paths if exposing public internet; add rate limiting & WAF as applicable.

---

## � Django Authentication Integration (Phase 2: RS256 + JWKS)

Phase 2 upgrades the authentication layer from symmetric HS256 to asymmetric RS256 with a published JWKS for secure verification across microservices, frontends, and the EMR bridge.

### Why RS256?
* Key separation: Private key stays only in the Django auth service; public key distributed via JWKS
* Safer rotation: Issue new key (kid v2) while still serving old until expiry
* Multi-service trust: Each microservice validates tokens without sharing a secret

### Endpoints (Short Alias Paths)
```
POST /auth/api/token/          # obtain access + refresh (email + password)
POST /auth/api/token/refresh/  # refresh access token
GET  /auth/.well-known/jwks.json  # JWKS (RSA public keys)
```

Backward compatible originals remain under `/api/v1/auth/...`.

### Token Claims (Added)
| Claim | Purpose |
|-------|---------|
| `role` | Simplified RBAC role (patient, provider, admin, staff, researcher, pharmacy) |
| `specialties` | Optional array of provider specialty strings |
| `email` | User primary email |
| `name` | Display name (first + last) |

### Environment Variables (Core)
| Variable | Service | Description |
|----------|---------|-------------|
| `JWT_PRIVATE_KEY_PATH` | django-auth | Path to RSA private key (PEM) |
| `JWT_PUBLIC_KEY_PATH`  | django-auth | Path to RSA public key (PEM) |
| `JWT_ALGORITHM`        | django-auth | Should be `RS256` |
| `JWT_ISSUER` / `JWT_AUDIENCE` | django-auth + verifiers | Issuer / audience consistency |
| `JWT_JWKS_URL` or `JWKS_URL` | microservices | Points to `https://<host>/auth/.well-known/jwks.json` |

### Microservice Configuration
Prefer the alias JWKS endpoint:
```
JWKS_URL=https://auth.example.com/auth/.well-known/jwks.json
```
If older path already deployed:
```
JWKS_URL=https://auth.example.com/api/v1/auth/.well-known/jwks.json  # still supported
```

### Frontend Helper Usage
File: `assets/webqx-token-auth.js`
```
import { login, refresh, getAccessToken, clearTokens } from './assets/webqx-token-auth.js';

// Auto mode uses relative /auth/* when served behind same domain
await login({ email: 'demo@webqx.health', password: 'demo123', baseUrl: 'auto' });
const token = getAccessToken();

// Later, to refresh:
await refresh();
```

Handles storage of both `access` and `refresh` tokens (localStorage keys: `webqx_access_token`, `webqx_refresh_token`).

### Frontend Auth Quickstart

Minimal sequence to integrate authenticated API calls with automatic refresh:
```
<script src="/assets/webqx-token-auth.js"></script>
<script>
	async function init(){
		// 1. Perform login (auto resolves to same-origin /auth/* endpoints)
		await WebQXAuth.login({ baseUrl: 'auto', email: 'demo@webqx.health', password: 'demo123' });

		// 2. Start background refresh (checks every 60s; refresh ~30s before expiry)
		WebQXAuth.initAutoRefresh({ baseUrl: 'auto', intervalSec: 60 });

		// 3. Use ensureFreshAccessToken before critical calls
		async function callProtected(){
			const token = await WebQXAuth.ensureFreshAccessToken('auto');
			const r = await fetch('/api/v1/secure/resource', { headers: { Authorization: 'Bearer '+token }});
			console.log(await r.json());
		}
		callProtected();
	}
	init();
</script>
```

Helper API surface:
| Function | Purpose |
|----------|---------|
| `login({baseUrl,email,password})` | Acquire access + refresh tokens |
| `refresh(baseUrl)` | Manually exchange refresh token |
| `getToken()` | Return current access token (may be expired) |
| `getClaims()` | Decoded claims (role, specialties, etc.) |
| `ensureFreshAccessToken(baseUrl)` | Returns valid (refreshing if near/after expiry) or null |
| `initAutoRefresh({ baseUrl, intervalSec })` | Starts periodic silent refresh loop |
| `logout()` | Clears tokens & cancels auto refresh |

Access token is proactively refreshed if within 30s of expiry. If refresh fails (revoked/expired), tokens are cleared to enforce re-authentication.

### Rotating Keys
1. Generate new keypair → save as `private-v2.pem` / `public-v2.pem`
2. Serve both keys in JWKS (update view to emit two entries with different `kid` values)
3. Switch `JWT_ACTIVE_KID` (if implemented) or start signing with new key
4. After old tokens expire, remove v1 key from JWKS

### Verifying Tokens (Node Example)
```
import jwksClient from 'jwks-rsa';
import jwt from 'jsonwebtoken';

const client = jwksClient({ jwksUri: process.env.JWT_JWKS_URL });
function getKey(header, cb){
	client.getSigningKey(header.kid, (err, key) => {
		if (err) return cb(err);
		cb(null, key.getPublicKey());
	});
}
jwt.verify(token, getKey, { algorithms: ['RS256'], issuer: 'webqx.healthcare' }, (err, decoded) => {
	// decoded.role, decoded.specialties
});
```

### EMR Bridge Update
`webqx-emr-system/api/auth/jwt_validator.php` continues to support the original `/api/v1/auth/.well-known/jwks.json`. To standardize, set:
```
DJANGO_JWKS_URL="${DJANGO_BASE_URL}/auth/.well-known/jwks.json"
```
If unset it falls back to the legacy path.

### Migration Checklist
| Step | Action | Status |
|------|--------|--------|
| 1 | Generate RSA keypair (private.pem/public.pem) | ✅ |
| 2 | Expose JWKS endpoint | ✅ |
| 3 | Add short alias endpoints | ✅ |
| 4 | Inject role & specialties claims | ✅ |
| 5 | Update frontend helper (email + refresh) | ✅ |
| 6 | Update microservice env docs to /auth/.well-known/jwks.json | ⏳ |
| 7 | Rotate legacy HS256 out (when safe) | ⏳ |

### Next Hardening Ideas
* Refresh token rotation & reuse detection
* Token introspection caching layer
* MFA claim embedding (amr) post-successful OTP
* Per-service audience values for finer scoping
* System-to-system client credentials grant (separate key set)

---

## �🚀 CI / CD & Deployment

Automated GitHub Actions workflow (`.github/workflows/deploy.yml`) performs:

- Install & run Jest tests
- Build & push Docker images to GHCR:
	- `ghcr.io/<org>/webqx-emr`
	- `ghcr.io/<org>/webqx-auth`
- Build & publish static site (landing + assets) to GitHub Pages

Artifacts:
- Test report uploaded (if produced)
- Pages artifact (dist/) deployed to environment `github-pages`

No secrets required for GHCR push (uses built-in `GITHUB_TOKEN`). Add optional secrets if you introduce external registries:
```
REGISTRY_USERNAME
REGISTRY_PASSWORD
```

To disable image publishing temporarily, comment out the `build-docker` job or set a conditional on commit message.

---

Contact: [info@webqx.healthcare](https://github.com/webqx-health)  
_“Care equity begins with code equity.”_

