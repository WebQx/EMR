@echo off
REM WebQX Auto-Service - Keeps servers running automatically

:START
echo [%time%] Starting WebQX Auto-Service...

REM Clear dedicated ports
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do taskkill /F /PID %%a >nul 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do taskkill /F /PID %%a >nul 2>nul

REM Start servers
cd /d "c:\Users\na210\OneDrive\Documents\GitHub\webqx\django-auth-backend"
start /MIN "WebQX-Auth" cmd /c "node auth-server-social.js"

cd /d "c:\Users\na210\OneDrive\Documents\GitHub\webqx"
start /MIN "WebQX-Frontend" cmd /c "node static-server.js"

echo [%time%] WebQX servers started
timeout /t 10 >nul

:MONITOR
REM Check if servers are running
netstat -ano | findstr :3000 >nul
if %ERRORLEVEL% NEQ 0 goto RESTART_FRONTEND

netstat -ano | findstr :3001 >nul
if %ERRORLEVEL% NEQ 0 goto RESTART_AUTH

timeout /t 30 >nul
goto MONITOR

:RESTART_FRONTEND
echo [%time%] Frontend server down - restarting...
cd /d "c:\Users\na210\OneDrive\Documents\GitHub\webqx"
start /MIN "WebQX-Frontend" cmd /c "node static-server.js"
goto MONITOR

:RESTART_AUTH
echo [%time%] Auth server down - restarting...
cd /d "c:\Users\na210\OneDrive\Documents\GitHub\webqx\django-auth-backend"
start /MIN "WebQX-Auth" cmd /c "node auth-server-social.js"
goto MONITOR