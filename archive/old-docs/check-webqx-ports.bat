@echo off
echo ========================================
echo WebQX Port Status Checker
echo ========================================
echo.

echo 🔍 Checking WebQX dedicated ports...
echo.

REM Check each WebQX port
echo 📱 Main WebQX Server (Port 3000):
netstat -an | findstr :3000 >nul
if %errorlevel%==0 (
    echo   ✅ ACTIVE
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do echo   PID: %%a
) else (
    echo   ❌ NOT RUNNING
)
echo.

echo 👥 User Registration System (Port 3001):
netstat -an | findstr :3001 >nul
if %errorlevel%==0 (
    echo   ✅ ACTIVE
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001') do echo   PID: %%a
) else (
    echo   ❌ NOT RUNNING
)
echo.

echo 📊 Analytics Server (Port 3002):
netstat -an | findstr :3002 >nul
if %errorlevel%==0 (
    echo   ✅ ACTIVE
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3002') do echo   PID: %%a
) else (
    echo   ❌ NOT RUNNING
)
echo.

echo 🏥 EMR System (Port 8080):
netstat -an | findstr :8080 >nul
if %errorlevel%==0 (
    echo   ✅ ACTIVE
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080') do echo   PID: %%a
) else (
    echo   ❌ NOT RUNNING
)
echo.

echo 🔌 WebSocket Server (Port 8081):
netstat -an | findstr :8081 >nul
if %errorlevel%==0 (
    echo   ✅ ACTIVE
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8081') do echo   PID: %%a
) else (
    echo   ❌ NOT RUNNING
)
echo.

echo ========================================
echo 💡 Port Management Status
echo ========================================
if exist ".port-locks.json" (
    echo ✅ Port lock file exists
    echo 📄 Contents:
    type ".port-locks.json"
) else (
    echo ❌ No port lock file found
)
echo.

echo 🌐 Quick Access URLs:
echo   📱 Main Portal:     http://localhost:3000
echo   👥 User System:     http://localhost:3001  
echo   📊 Analytics:       http://localhost:3002
echo   🏥 EMR System:      http://localhost:8080
echo.
pause