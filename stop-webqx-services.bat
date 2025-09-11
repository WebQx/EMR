@echo off
echo ========================================
echo Stopping WebQX Healthcare Platform
echo ========================================
echo.

echo 🛑 Stopping all WebQX services...

REM Kill processes on WebQX dedicated ports
echo 📱 Stopping Main WebQX Server (Port 3000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    echo   Killing PID %%a
    taskkill /f /pid %%a >nul 2>&1
)

echo 👥 Stopping User Registration System (Port 3001)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001') do (
    echo   Killing PID %%a
    taskkill /f /pid %%a >nul 2>&1
)

echo 📊 Stopping Analytics Server (Port 3002)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3002') do (
    echo   Killing PID %%a
    taskkill /f /pid %%a >nul 2>&1
)

echo 🏥 Stopping EMR System (Port 8080)...
for /f "tokens=5" %%a in ('netstat-aon ^| findstr :8080') do (
    echo   Killing PID %%a
    taskkill /f /pid %%a >nul 2>&1
)

echo 🔌 Stopping WebSocket Server (Port 8081)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8081') do (
    echo   Killing PID %%a
    taskkill /f /pid %%a >nul 2>&1
)

REM Clean up port lock file
if exist ".port-locks.json" (
    echo 🧹 Cleaning up port reservations...
    del ".port-locks.json" >nul 2>&1
)

echo.
echo ✅ All WebQX services stopped successfully!
echo 🔓 All ports have been released
echo.
pause