@echo off
REM WebQx Healthcare Platform - Auto-Start Services
REM This script starts all WebQx services for EMR, Telehealth, and Authentication

echo ===============================================
echo WebQx Healthcare Platform - Starting Services
echo ===============================================
echo Starting at: %date% %time%
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Set the base directory (adjust this path to match your installation)
set WEBQX_HOME=c:\Users\na210\OneDrive\Documents\GitHub\webqx
cd /d "%WEBQX_HOME%"

echo Current directory: %CD%
echo.

REM Check if WebQX dedicated ports are available
echo Checking WebQX dedicated ports (3000, 3001)...
netstat -ano | findstr :3000 >nul
if %ERRORLEVEL% EQU 0 (
    echo WARNING: Port 3000 is occupied - killing processes...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do taskkill /F /PID %%a >nul 2>nul
)
netstat -ano | findstr :3001 >nul
if %ERRORLEVEL% EQU 0 (
    echo WARNING: Port 3001 is occupied - killing processes...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do taskkill /F /PID %%a >nul 2>nul
)
echo WebQX dedicated ports cleared.
timeout /t 2 >nul

echo.
echo Starting WebQx Backend Services...
echo.

REM Start WebQX Auto-Service
echo Starting WebQX Auto-Service (keeps servers running automatically)...
cd /d "%WEBQX_HOME%"
start "WebQX Auto-Service" scripts\webqx-service.bat
timeout /t 5

echo.
echo ===============================================
echo WebQx Services Started Successfully!
echo ===============================================
echo.
echo Access Points:
echo - Main Platform:     http://localhost:3000
echo - Login Page:        http://localhost:3000/login-clean.html
echo - Admin Console:     http://localhost:3000/admin-console/
echo - Clean Admin:      http://localhost:3000/admin-console-clean.html
echo - GitHub Pages:     http://localhost:3000/index-github-pages.html
echo - Patient Portal:    http://localhost:3000/patient-portal/
echo - Provider Portal:   http://localhost:3000/provider/
echo - Telehealth:        http://localhost:3000/telehealth/
echo - API Backend:       http://localhost:3001
echo - Health Check:      http://localhost:3001/health/
echo.
echo Demo Accounts:
echo - Patient:           demo@patient.com / patient123
echo - Physician:         physician@webqx.com / demo123
echo - Provider:          doctor@webqx.com / provider123
echo - Administrator:     admin@webqx.com / admin123
echo.
echo Press any key to open the main platform...
pause >nul

REM Open the main platform in default browser
start http://localhost:3000/login-clean.html

echo.
echo WebQx Platform is now running!
echo Keep this window open to monitor services.
echo To stop services, close the server windows or run stop-webqx-services.bat
echo.
pause

