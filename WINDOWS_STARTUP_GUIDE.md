# WebQx Healthcare Platform - Windows Automatic Startup Guide

## 🎯 Overview
This guide sets up your WebQx Healthcare Platform to automatically start with Windows, ensuring EMR, Telehealth, and Authentication services are always available.

## 🚀 Quick Setup (Recommended)

### Option 1: Automatic Installation
```powershell
# Run as Administrator
cd "c:\Users\na210\OneDrive\Documents\GitHub\webqx\scripts"
.\Install-WebQxStartup.ps1 -Install
```

### Option 2: Manual Setup
```batch
# Double-click this file to start services manually
c:\Users\na210\OneDrive\Documents\GitHub\webqx\scripts\start-webqx-services.bat
```

## 📋 What Gets Installed

### 1. Windows Scheduled Task
- **Name**: "WebQx Healthcare Platform"
- **Trigger**: System startup (runs when Windows boots)
- **Action**: Starts WebQx services automatically
- **Privileges**: Runs with user privileges

### 2. User Startup Shortcut
- **Location**: `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup`
- **Purpose**: Starts services when user logs in
- **Backup**: Ensures services start even if scheduled task fails

### 3. Desktop Shortcut
- **Location**: Desktop
- **Purpose**: Manual start/restart of services
- **Icon**: Medical cross icon

## 🔧 Available Scripts

### Core Scripts
| Script | Purpose | Usage |
|--------|---------|--------|
| `start-webqx-services.bat` | Start all services | Double-click or run from cmd |
| `stop-webqx-services.bat` | Stop all services | Double-click or run from cmd |
| `Start-WebQxServices.ps1` | Advanced PowerShell startup | `.\Start-WebQxServices.ps1` |
| `Install-WebQxStartup.ps1` | Setup automatic startup | `.\Install-WebQxStartup.ps1 -Install` |

### PowerShell Parameters
```powershell
# Silent startup (no windows)
.\Start-WebQxServices.ps1 -Silent

# Automatic startup mode
.\Start-WebQxServices.ps1 -AutoStart

# Combined for system startup
.\Start-WebQxServices.ps1 -Silent -AutoStart
```

## 🌐 Services Started

### Backend Services (Port 3001)
- **Authentication Server**: JWT + OAuth2 (Google, Microsoft)
- **API Gateway**: REST API for all healthcare modules
- **Security Layer**: Rate limiting, CORS, encryption

### Frontend Services (Port 3000)
- **Static File Server**: Serves all HTML/CSS/JS files
- **Professional Login**: Clean healthcare login interface
- **Module Access**: EMR, Telehealth, Patient Portal, Admin Console

## 🔍 Access Points After Startup

### Main Platform
- **Homepage**: http://localhost:3000
- **Login**: http://localhost:3000/login-clean.html
- **Patient Portal**: http://localhost:3000/patient-portal/
- **Provider Portal**: http://localhost:3000/provider/
- **Admin Console**: http://localhost:3000/admin-console/
- **Telehealth**: http://localhost:3000/telehealth/

### API & Backend
- **API Base**: http://localhost:3001
- **Health Check**: http://localhost:3001/health/
- **OAuth Google**: http://localhost:3001/auth/google
- **OAuth Microsoft**: http://localhost:3001/auth/microsoft

## 🔐 Demo Accounts (Always Available)
```
Patient Access:
- Email: demo@patient.com
- Password: patient123

Physician Access:
- Email: physician@webqx.com  
- Password: demo123

Provider Access:
- Email: doctor@webqx.com
- Password: provider123

Administrator Access:
- Email: admin@webqx.com
- Password: admin123
```

## 📊 Management Commands

### Check Status
```powershell
.\Install-WebQxStartup.ps1 -Status
```

### Manual Start
```batch
start-webqx-services.bat
```

### Manual Stop
```batch
stop-webqx-services.bat
```

### Remove Automatic Startup
```powershell
.\Install-WebQxStartup.ps1 -Uninstall
```

## 🛠️ Troubleshooting

### Services Won't Start
1. **Check Node.js Installation**
   ```cmd
   node --version
   npm --version
   ```

2. **Check Port Conflicts**
   ```cmd
   netstat -an | findstr :3000
   netstat -an | findstr :3001
   ```

3. **Kill Conflicting Processes**
   ```cmd
   taskkill /F /IM node.exe
   ```

### Automatic Startup Issues
1. **Check Scheduled Task**
   - Open Task Scheduler
   - Look for "WebQx Healthcare Platform"
   - Check task status and last run result

2. **Check Startup Folder**
   - Navigate to: `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup`
   - Verify "WebQx Healthcare Platform.lnk" exists

3. **Check Permissions**
   - Run PowerShell as Administrator
   - Re-run installation: `.\Install-WebQxStartup.ps1 -Install`

### Performance Issues
1. **Increase Startup Delay**
   - Edit scheduled task
   - Add 30-60 second delay after system startup

2. **Check System Resources**
   - Monitor CPU and memory usage
   - Ensure sufficient free RAM (recommended: 4GB+)

## 🔄 Advanced Configuration

### Custom Installation Path
1. Edit scripts to update `$WebQxHome` variable
2. Update all file paths accordingly
3. Re-run installation

### Different Ports
1. Edit `auth-server-social.js` - change PORT variable
2. Edit `static-server.js` - change PORT variable  
3. Update CORS settings
4. Restart services

### Production Deployment
1. Set environment variables for OAuth credentials
2. Update CORS origins for production domains
3. Configure SSL/HTTPS
4. Set up proper logging and monitoring

## 📁 File Structure
```
webqx/
├── scripts/
│   ├── start-webqx-services.bat          # Simple batch startup
│   ├── stop-webqx-services.bat           # Simple batch stop
│   ├── Start-WebQxServices.ps1           # Advanced PowerShell startup
│   └── Install-WebQxStartup.ps1          # Windows integration
├── django-auth-backend/
│   └── auth-server-social.js             # Authentication server
├── static-server.js                      # Frontend server
├── login-clean.html                      # Professional login page
├── logs/                                 # Startup logs (auto-created)
└── WINDOWS_STARTUP_GUIDE.md             # This file
```

## ✅ Verification Steps

### After Installation
1. **Restart Computer** - Services should start automatically
2. **Open Browser** - Navigate to http://localhost:3000
3. **Test Login** - Use demo credentials
4. **Check Services** - Both ports 3000 and 3001 should respond

### Daily Operation
- **Access Platform**: Click desktop shortcut or browse to localhost
- **Login**: Use social login (Google/Microsoft) or demo accounts
- **Multiple Users**: Platform supports concurrent users
- **Always Available**: Services restart automatically after reboot

## 🎉 Success Indicators

When everything is working correctly, you should see:
- ✅ Desktop shortcut launches WebQx platform
- ✅ After restart, platform loads automatically
- ✅ Both social login and traditional login work
- ✅ All healthcare modules are accessible
- ✅ Services restart automatically if they crash
- ✅ EMR, Telehealth, and Authentication always available

---

**🏥 Your WebQx Healthcare Platform is now configured for 24/7 automatic operation!**

Users can access EMR, Telehealth, and all healthcare features immediately after Windows starts, without any manual intervention.
