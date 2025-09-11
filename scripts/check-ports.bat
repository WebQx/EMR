@echo off
REM Check if WebQX dedicated ports are available

echo Checking WebQX dedicated ports...
echo.

REM Check port 3000
echo [PORT 3000] Frontend Server:
netstat -ano | findstr :3000
if %ERRORLEVEL% EQU 0 (
    echo WARNING: Port 3000 is in use by another process
    echo Kill process: taskkill /F /PID [PID_NUMBER]
) else (
    echo AVAILABLE: Port 3000 is free for WebQX Frontend
)

echo.

REM Check port 3001
echo [PORT 3001] Auth Server:
netstat -ano | findstr :3001
if %ERRORLEVEL% EQU 0 (
    echo WARNING: Port 3001 is in use by another process
    echo Kill process: taskkill /F /PID [PID_NUMBER]
) else (
    echo AVAILABLE: Port 3001 is free for WebQX Backend
)

echo.
echo WebQX DEDICATED PORTS: 3000, 3001
echo These ports are reserved exclusively for WebQX services
pause