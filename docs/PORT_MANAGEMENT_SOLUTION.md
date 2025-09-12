# WebQX Port Management Solution

## Problem Solved
Your servers were changing ports because multiple services were trying to use the same ports, causing conflicts. This solution provides **dedicated port assignment** and **automatic conflict resolution**.

## Dedicated Port Assignments

| Service | Port | Purpose |
|---------|------|---------|
| Main WebQX Server | 3000 | Patient Portal, FHIR API, Main Application |
| User Registration | 3001 | Global user registration and authentication |
| Analytics Server | 3002 | Real-time analytics and reporting |
| EMR System | 8080 | Electronic Medical Records |
| WebSocket Server | 8081 | Real-time communications |

## Files Created/Modified

### New Files:
- `port-manager.js` - Port reservation and conflict resolution system
- `start-webqx-fixed-ports.bat` - Startup script with dedicated ports
- `stop-webqx-services.bat` - Clean shutdown script
- `check-webqx-ports.bat` - Port status checker

### Modified Files:
- `server.js` - Added port management system
- `global-analytics-server/server.js` - Fixed to port 3002
- `global-user-system/server.js` - Fixed to port 3001
- `webqx-emr-system/server.js` - Fixed to port 8080

## How It Works

### 1. Port Reservation System
```javascript
// Automatically reserves ports and kills conflicting processes
const port = await portManager.reservePort('main', 3000);
```

### 2. Conflict Resolution
- Automatically detects port conflicts
- Kills existing processes on reserved ports
- Finds alternative ports if needed
- Maintains port lock file for tracking

### 3. Graceful Shutdown
- Releases reserved ports on exit
- Cleans up lock files
- Prevents zombie processes

## Usage Instructions

### Start All Services (Recommended)
```batch
# Run this to start all WebQX services with fixed ports
start-webqx-fixed-ports.bat
```

### Check Port Status
```batch
# Check which services are running and on which ports
check-webqx-ports.bat
```

### Stop All Services
```batch
# Clean shutdown of all services
stop-webqx-services.bat
```

### Start Individual Service
```batch
# Start just the main server
cd c:\Users\na210\OneDrive\Documents\GitHub\webqx
set PORT=3000
node server.js
```

## Benefits

✅ **No More Port Conflicts** - Each service has a dedicated port
✅ **Automatic Cleanup** - Kills conflicting processes automatically  
✅ **Consistent Startup** - Same ports every time
✅ **Easy Management** - Simple batch scripts for control
✅ **Status Monitoring** - Check which services are running
✅ **Graceful Shutdown** - Clean port release on exit

## Port Lock System

The system creates a `.port-locks.json` file to track reserved ports:

```json
{
  "main": {
    "port": 3000,
    "reserved_at": "2025-01-11T10:30:00.000Z",
    "pid": 12345
  },
  "analytics": {
    "port": 3002,
    "reserved_at": "2025-01-11T10:30:05.000Z", 
    "pid": 12346
  }
}
```

## Troubleshooting

### If a service won't start:
1. Run `check-webqx-ports.bat` to see port status
2. Run `stop-webqx-services.bat` to clean up
3. Run `start-webqx-fixed-ports.bat` to restart

### If ports are still conflicting:
1. Check for other applications using these ports
2. Modify `WEBQX_PORTS` in `port-manager.js` if needed
3. Restart Windows if processes are stuck

### Manual port cleanup:
```batch
# Kill specific port manually
netstat -ano | findstr :3000
taskkill /f /pid [PID_NUMBER]
```

## Next Steps

1. **Run the startup script**: `start-webqx-fixed-ports.bat`
2. **Verify all services**: `check-webqx-ports.bat`
3. **Access your services**:
   - Main Portal: http://localhost:3000
   - User System: http://localhost:3001
   - Analytics: http://localhost:3002
   - EMR System: http://localhost:8080

Your servers will now maintain consistent ports and won't conflict with each other!