# WebQx Healthcare Platform - Automatic Startup Setup Guide

## 🎯 Overview
This guide helps you set up WebQx Healthcare Platform to start automatically when Windows boots up, ensuring your EMR, telehealth, and authentication services are always available.

## 🚀 Quick Setup (Recommended)

### Option 1: Windows Task Scheduler (Most Reliable)
```powershell
# Run as Administrator
cd "c:\Users\na210\OneDrive\Documents\GitHub\webqx\scripts"
.\Setup-WebQxStartup.ps1
```

### Option 2: Windows Services (Advanced)
```cmd
# Run as Administrator
cd "c:\Users\na210\OneDrive\Documents\GitHub\webqx\scripts"
node install-webqx-services.js
```

### Option 3: Registry Startup (Simple)
```cmd
# Run as Administrator
cd "c:\Users\na210\OneDrive\Documents\GitHub\webqx\scripts"
register-webqx-startup.bat
```

## 📁 Available Scripts

### Startup Scripts
| Script | Purpose | Requirements |
|--------|---------|--------------|
| `start-webqx-services.bat` | Manual startup (batch) | None |
| `Start-WebQxServices.ps1` | Manual startup (PowerShell) | PowerShell |
| `Setup-WebQxStartup.ps1` | Create scheduled task | Administrator |
| `install-webqx-services.js` | Create Windows services | Administrator + Node.js |

### Management Scripts
| Script | Purpose | Requirements |
|--------|---------|--------------|
| `stop-webqx-services.bat` | Stop all services | None |
| `Setup-WebQxStartup.ps1 -Remove` | Remove scheduled task | Administrator |
| `uninstall-webqx-services.js` | Remove Windows services | Administrator + Node.js |
| `remove-webqx-startup.bat` | Remove registry startup | Administrator |

## 🔧 Setup Methods Comparison

### Method 1: Windows Task Scheduler ⭐ RECOMMENDED
**Pros:**
- Most reliable and flexible
- Built into Windows
- Easy to manage via Task Scheduler GUI
- Automatic restart on failure
- Delayed startup (waits for system to be ready)

**Cons:**
- Requires Administrator privileges
- More complex than registry method

**Setup:**
```powershell
# Run PowerShell as Administrator
cd "c:\Users\na210\OneDrive\Documents\GitHub\webqx\scripts"
.\Setup-WebQxStartup.ps1
```

### Method 2: Windows Services
**Pros:**
- True Windows services
- Best integration with Windows
- Service recovery options
- Professional deployment

**Cons:**
- Requires Administrator privileges
- More complex setup
- Requires node-windows package

**Setup:**
```cmd
# Run Command Prompt as Administrator
cd "c:\Users\na210\OneDrive\Documents\GitHub\webqx\scripts"
node install-webqx-services.js
```

### Method 3: Registry Startup Entry
**Pros:**
- Simple and fast
- Uses Windows Registry
- Minimal setup required

**Cons:**
- Less reliable than scheduled tasks
- No automatic restart on failure
- Runs immediately at login

**Setup:**
```cmd
# Run Command Prompt as Administrator
cd "c:\Users\na210\OneDrive\Documents\GitHub\webqx\scripts"
register-webqx-startup.bat
```

## 🌐 Services and Ports

After automatic startup, these services will be available:

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| Frontend Server | 3000 | http://localhost:3000 | Main platform interface |
| Authentication Backend | 3001 | http://localhost:3001 | OAuth2 and user management |
| Main Application | 8080 | http://localhost:8080 | EMR and telehealth features |

### Quick Access URLs
- **Main Platform**: http://localhost:3000/index-clean.html
- **Login Portal**: http://localhost:3000/login-clean.html
- **Patient Portal**: http://localhost:3000/patient-portal/
- **Provider Portal**: http://localhost:3000/provider/
- **Admin Console**: http://localhost:3000/admin-console/
- **Telehealth**: http://localhost:3000/telehealth/
- **API Health Check**: http://localhost:3001/health/

## ⚙️ Configuration

### Environment Variables (Optional)
Create a `.env` file in the WebQx root directory:
```env
NODE_ENV=production
WEBQX_AUTO_OPEN=true
WEBQX_STARTUP_DELAY=30
LOG_LEVEL=info
```

### Startup Delay
- **Task Scheduler**: 30 seconds after Windows startup
- **Windows Services**: Immediate
- **Registry Startup**: Immediate at user login

## 🔍 Troubleshooting

### Check if Services are Running
```powershell
# Check ports
netstat -an | findstr ":3000 :3001 :8080"

# Check Node.js processes
Get-Process node

# Check scheduled task
Get-ScheduledTask -TaskName "WebQx Healthcare Platform Auto-Start"

# Check Windows services
Get-Service -Name "WebQx*"
```

### Common Issues

#### Issue: Services don't start automatically
**Solution:**
1. Check if startup method is properly installed
2. Verify Administrator privileges were used during setup
3. Check Windows Event Viewer for errors
4. Test manual startup first

#### Issue: Port conflicts
**Solution:**
```cmd
# Kill processes using WebQx ports
netstat -ano | findstr ":3000"
taskkill /F /PID [PID_NUMBER]
```

#### Issue: Node.js not found
**Solution:**
1. Ensure Node.js is installed system-wide
2. Add Node.js to system PATH
3. Restart computer after Node.js installation

### Manual Recovery
If automatic startup fails, use manual startup:
```cmd
cd "c:\Users\na210\OneDrive\Documents\GitHub\webqx\scripts"
start-webqx-services.bat
```

## 📊 Monitoring and Logs

### Log Files
- **PowerShell logs**: `logs\webqx-services.log`
- **Windows Event Viewer**: Applications and Services Logs
- **Service logs**: Individual service stdout/stderr

### Health Monitoring
```powershell
# Quick health check
Invoke-WebRequest -Uri "http://localhost:3001/health/"

# Detailed system check
.\scripts\Start-WebQxServices.ps1 -Silent
```

## 🔄 Updates and Maintenance

### Restart Services
```cmd
# Stop all services
.\scripts\stop-webqx-services.bat

# Start all services
.\scripts\start-webqx-services.bat
```

### Update Startup Configuration
```powershell
# Remove old configuration
.\scripts\Setup-WebQxStartup.ps1 -Remove

# Install new configuration
.\scripts\Setup-WebQxStartup.ps1
```

### Backup Configuration
Important files to backup:
- `scripts\` directory
- `.env` file (if created)
- `package.json` dependencies

## 🚀 Testing Your Setup

### 1. Test Manual Startup
```cmd
cd "c:\Users\na210\OneDrive\Documents\GitHub\webqx\scripts"
start-webqx-services.bat
```

### 2. Verify All Services
Open these URLs in browser:
- http://localhost:3000/index-clean.html ✅
- http://localhost:3001/health/ ✅
- http://localhost:8080/health ✅

### 3. Test Automatic Startup
1. Install your preferred startup method
2. Restart your computer
3. Wait 2-3 minutes for services to start
4. Test the URLs above

### 4. Test Service Recovery
```cmd
# Kill a service
taskkill /F /IM node.exe

# Wait and check if it restarts automatically (for Windows Services/Scheduled Tasks)
```

## ✅ Success Checklist

- [ ] Node.js installed and in PATH
- [ ] WebQx files in correct location
- [ ] Startup method installed with Administrator privileges
- [ ] Manual startup test successful
- [ ] Automatic startup test successful
- [ ] All URLs accessible after restart
- [ ] Service recovery working (if applicable)

---

## 🎉 Congratulations!

Your WebQx Healthcare Platform is now configured for automatic startup. Users can access the EMR, telehealth, and other features immediately after Windows boots up, ensuring continuous availability of your healthcare services.

### Support Commands
```cmd
# View installed startup method
Get-ScheduledTask -TaskName "*WebQx*"
Get-Service -Name "*WebQx*"

# Quick restart all services
.\scripts\stop-webqx-services.bat && .\scripts\start-webqx-services.bat

# Remove all startup methods
.\scripts\Setup-WebQxStartup.ps1 -Remove
.\scripts\uninstall-webqx-services.js
.\scripts\remove-webqx-startup.bat
```
