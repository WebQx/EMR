@echo off
echo ========================================
echo WebQX Healthcare Platform - Fixed Ports
echo ========================================
echo.

REM Kill any existing processes on WebQX ports
echo 🧹 Cleaning up existing processes...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3002') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8081') do taskkill /f /pid %%a >nul 2>&1

echo ✅ Ports cleaned up
echo.

REM Start WebQX services with dedicated ports
echo 🚀 Starting WebQX services with dedicated ports...
echo.

REM Start main WebQX server (Port 3000)
echo 📱 Starting Main WebQX Server on port 3000...
start "WebQX Main Server" cmd /k "cd /d %~dp0 && set PORT=3000 && node server.js"
timeout /t 3 >nul

REM Start User Registration System (Port 3001)
echo 👥 Starting User Registration System on port 3001...
start "WebQX User System" cmd /k "cd /d %~dp0\global-user-system && set PORT=3001 && node server.js"
timeout /t 2 >nul

REM Start Analytics Server (Port 3002)
echo 📊 Starting Analytics Server on port 3002...
start "WebQX Analytics" cmd /k "cd /d %~dp0\global-analytics-server && set PORT=3002 && node server.js"
timeout /t 2 >nul

REM Start EMR System (Port 8080)
echo 🏥 Starting EMR System on port 8080...
start "WebQX EMR System" cmd /k "cd /d %~dp0\webqx-emr-system && node server.js"
timeout /t 2 >nul

echo.
echo ========================================
echo ✅ WebQX Healthcare Platform Started!
echo ========================================
echo.
echo 🌐 Services Running:
echo   📱 Main Portal:     http://localhost:3000
echo   👥 User System:     http://localhost:3001
echo   📊 Analytics:       http://localhost:3002
echo   🏥 EMR System:      http://localhost:8080
echo.
echo 💡 To stop all services, close all command windows
echo    or run: stop-webqx-services.bat
echo.
echo ⚡ Port Management: ACTIVE
echo 🔒 Dedicated ports are now reserved for WebQX
echo.
pause