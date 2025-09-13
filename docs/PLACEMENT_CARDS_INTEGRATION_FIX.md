# 🔧 WebQx Placement Cards Server Integration Fixes

## Issues Identified & Solutions

### 1. **Missing Module Card API Endpoints**
**Problem**: Patient portal cards use `onclick="alert()"` instead of real API calls
**Fix**: Add proper API endpoints for each module card

### 2. **No Real-time Data Binding**
**Problem**: Static data in placement cards
**Fix**: Implement WebSocket connections for live updates

### 3. **Missing Error Handling**
**Problem**: No fallback when server is unavailable
**Fix**: Add graceful degradation and offline mode

## Implementation Fixes

### Patient Portal Module Cards API Integration
```javascript
// Add to server.js
app.get('/api/patient/dashboard', authenticateToken, (req, res) => {
  res.json({
    appointments: { count: 2, next: "Tomorrow 2:00 PM" },
    prescriptions: { active: 3, ready: 1 },
    messages: { unread: 1 },
    healthScore: 98
  });
});

app.get('/api/patient/appointments', authenticateToken, (req, res) => {
  res.json([
    { id: 1, doctor: "Dr. Smith", date: "2025-01-12T14:00:00Z", type: "Follow-up" },
    { id: 2, doctor: "Dr. Johnson", date: "2025-01-15T10:00:00Z", type: "Annual Checkup" }
  ]);
});
```

### Provider Portal Module Cards Integration
```javascript
// Add to server.js
app.get('/api/provider/dashboard', authenticateToken, (req, res) => {
  res.json({
    patients: { total: 45, today: 8 },
    appointments: { today: 12, pending: 3 },
    alerts: { critical: 2, normal: 5 }
  });
});
```

### Real-time WebSocket Integration
```javascript
// Add WebSocket support
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    if (data.type === 'subscribe_patient_updates') {
      // Subscribe to patient updates
      ws.patientId = data.patientId;
    }
  });
});
```

## Fixed Files Created