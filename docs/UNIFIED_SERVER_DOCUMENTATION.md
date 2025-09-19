# WebQX™ Healthcare Platform Gateway (formerly Unified Healthcare Server)

## Overview

The WebQX Healthcare Platform Gateway is a comprehensive solution that integrates three essential healthcare services into a single, unified platform:

- **Django Authentication Server** (Port 3001) - JWT-based authentication, user management, and security
- **OpenEMR Integration Server** (Port 3002) - FHIR APIs, patient data, and EHR connectivity
- **Telehealth Services Server** (Port 3003) - Video conferencing, messaging, and real-time communication
- **Main API Gateway** (Port 3000) - Unified access point and service orchestration

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    WebQX Healthcare Platform Gateway           │
├─────────────────────────────────────────────────────────────────┤
│  Main API Gateway (Port 3000)                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Proxy     │  │   Routing   │  │   Security  │             │
│  │ Middleware  │  │   Engine    │  │  Controls   │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
├─────────────────────────────────────────────────────────────────┤
│  Backend Services                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Django    │  │   OpenEMR   │  │ Telehealth  │             │
│  │ Auth Server │  │ Integration │  │  Services   │             │
│  │ (Port 3001) │  │ (Port 3002) │  │ (Port 3003) │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Install Dependencies

```bash
cd /workspaces/webqx
npm install
```

### 2. Start All Services

```bash
# Option 1: Use the startup script
node start-webqx-server.js

# Option 2: Use npm script
npm run start:unified
```

### 3. Access Services

Once started, all services are accessible through the main gateway:

- **Main Portal**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **Authentication**: http://localhost:3000/api/auth/*
- **OpenEMR/FHIR**: http://localhost:3000/api/openemr/* or http://localhost:3000/fhir/*
- **Telehealth**: http://localhost:3000/api/telehealth/*
- **WebSocket**: ws://localhost:3000/ws

## Service Details

### Django Authentication Server (Port 3001)

**Features:**
- JWT-based authentication
- User registration and management
- Role-based access control (admin, provider, patient)
- Multi-factor authentication (MFA)
- Account security (lockout, rate limiting)
- HIPAA audit logging

**Demo Users:**
- Admin: `admin` / `admin123`
- Provider: `provider` / `provider123`
- Patient: `patient` / `patient123`

**API Endpoints:**
```
POST /api/v1/auth/register    - User registration
POST /api/v1/auth/login       - User login
POST /api/v1/auth/refresh     - Refresh JWT token
POST /api/v1/auth/logout      - User logout
GET  /api/v1/auth/profile     - Get user profile
PUT  /api/v1/auth/profile     - Update user profile
POST /api/v1/auth/change-password - Change password
GET  /api/v1/auth/security/dashboard - Security dashboard
```

**Example Usage:**
```bash
# Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Get profile (requires Bearer token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/v1/auth/profile
```

### OpenEMR Integration Server (Port 3002)

**Features:**
- FHIR R4 compliant API
- OAuth2 authentication
- Patient management
- Appointment scheduling
- Clinical observations
- OpenEMR integration

**FHIR Endpoints:**
```
GET  /fhir/metadata           - FHIR capability statement
GET  /fhir/Patient            - Search patients
GET  /fhir/Patient/:id        - Get specific patient
POST /fhir/Patient            - Create patient
PUT  /fhir/Patient/:id        - Update patient
GET  /fhir/Appointment        - Search appointments
GET  /fhir/Observation        - Search observations
```

**OpenEMR API Endpoints:**
```
GET /api/v1/openemr/patients     - Get OpenEMR patients
GET /api/v1/openemr/appointments - Get OpenEMR appointments
GET /api/v1/openemr/providers    - Get OpenEMR providers
GET /api/v1/openemr/config       - Get configuration
```

**Example Usage:**
```bash
# Get FHIR metadata
curl -H "Authorization: Bearer demo-token" \
  http://localhost:3002/fhir/metadata

# Search patients
curl -H "Authorization: Bearer demo-token" \
  http://localhost:3002/fhir/Patient
```

### Telehealth Services Server (Port 3003)

**Features:**
- WebRTC video conferencing
- Secure messaging
- Real-time notifications
- Session management
- WebSocket support
- HIPAA-compliant communications

**Video API Endpoints:**
```
POST /api/v1/telehealth/video/session/start          - Start video session
POST /api/v1/telehealth/video/session/:id/join       - Join video session
POST /api/v1/telehealth/video/session/:id/leave      - Leave video session
GET  /api/v1/telehealth/video/session/:id/status     - Get session status
```

**Messaging API Endpoints:**
```
POST /api/v1/telehealth/messaging/send               - Send message
GET  /api/v1/telehealth/messaging/history/:id        - Get message history
```

**Session Management:**
```
GET /api/v1/telehealth/sessions                      - List active sessions
```

**Example Usage:**
```bash
# Start video session
curl -X POST http://localhost:3003/api/v1/telehealth/video/session/start \
  -H "Authorization: Bearer demo-token" \
  -H "Content-Type: application/json" \
  -d '{"sessionType":"consultation","maxParticipants":2}'

# Send message
curl -X POST http://localhost:3003/api/v1/telehealth/messaging/send \
  -H "Authorization: Bearer demo-token" \
  -H "Content-Type: application/json" \
  -d '{"recipientId":"user123","message":"Hello","sessionId":"session123"}'
```

## Unified Gateway Access

All services can be accessed through the main gateway (port 3000) with automatic routing:

```bash
# Authentication through gateway
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# FHIR through gateway
curl -H "Authorization: Bearer demo-token" \
  http://localhost:3000/fhir/Patient

# Telehealth through gateway
curl -X POST http://localhost:3000/api/telehealth/video/session/start \
  -H "Authorization: Bearer demo-token" \
  -H "Content-Type: application/json" \
  -d '{"sessionType":"consultation"}'
```

## WebSocket Connections

Connect to real-time features through WebSocket:

```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:3000/ws');

// Authenticate
ws.send(JSON.stringify({
  type: 'auth',
  userId: 'your-user-id',
  token: 'your-jwt-token'
}));

// Join video session
ws.send(JSON.stringify({
  type: 'join_session',
  sessionId: 'session-id'
}));

// WebRTC signaling
ws.send(JSON.stringify({
  type: 'webrtc_signal',
  targetUserId: 'target-user',
  signal: { /* WebRTC signal data */ }
}));
```

## Development Commands

### Start Individual Services

```bash
# Start Django auth server only
npm run start:django
# or
node django-auth-server.js

# Start OpenEMR server only
npm run start:openemr
# or
node openemr-server.js

# Start Telehealth server only
npm run start:telehealth
# or
node telehealth-server.js
```

### Health Checks

```bash
# Check all services
curl http://localhost:3000/health

# Check individual services
curl http://localhost:3001/health  # Django
curl http://localhost:3002/health  # OpenEMR
curl http://localhost:3003/health  # Telehealth
```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# Main configuration
NODE_ENV=development
MAIN_PORT=3000
DJANGO_PORT=3001
OPENEMR_PORT=3002
TELEHEALTH_PORT=3003

# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# OpenEMR Configuration
OPENEMR_BASE_URL=https://demo.openemr.io
OPENEMR_CLIENT_ID=webqx-demo
OPENEMR_CLIENT_SECRET=your-client-secret
OPENEMR_FHIR_ENABLED=true

# Security
REQUIRE_MFA=false
OPENEMR_VERIFY_SSL=true
VIDEO_RECORDING_ENABLED=false
```

## Security Features

1. **Authentication & Authorization**
   - JWT-based authentication
   - Role-based access control
   - Token refresh mechanism
   - Account lockout protection

2. **Rate Limiting**
   - Global API rate limiting
   - Strict authentication rate limiting
   - Per-service rate limiting

3. **Security Headers**
   - Helmet.js security middleware
   - CORS configuration
   - Content Security Policy

4. **HIPAA Compliance**
   - Comprehensive audit logging
   - Encrypted communications
   - Session management
   - Data access controls

## Monitoring & Health Checks

The system includes built-in monitoring:

- **Health Monitoring**: Automatic health checks every 30 seconds
- **Service Discovery**: Automatic service status tracking
- **Graceful Shutdown**: Clean service termination
- **Process Management**: PID tracking and process monitoring

## Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Kill processes on ports
   lsof -ti:3000,3001,3002,3003 | xargs -r kill -9
   ```

2. **Missing Dependencies**
   ```bash
   npm install
   ```

3. **Service Not Starting**
   - Check logs in terminal output
   - Verify port availability
   - Check environment variables

### Logs

All services provide detailed logging:
- Service startup logs
- Health check results
- Audit events
- Error messages

## Production Deployment

For production deployment:

1. **Database Integration**
   - Replace in-memory storage with PostgreSQL/MySQL
   - Configure connection pooling
   - Set up backup strategies

2. **Security Hardening**
   - Use strong JWT secrets
   - Enable HTTPS/TLS
   - Configure proper CORS origins
   - Enable MFA for all users

3. **Scalability**
   - Use PM2 for process management
   - Configure load balancing
   - Set up Redis for session storage
   - Implement caching strategies

4. **Monitoring**
   - Set up proper logging infrastructure
   - Configure alerting
   - Implement metrics collection
   - Set up health check endpoints

## Support

For support and questions:
- Check the health endpoints for service status
- Review the audit logs for security events
- Use the built-in monitoring features
- Refer to individual service documentation

## License

This project is licensed under the Apache License 2.0 - see the LICENSE.md file for details.