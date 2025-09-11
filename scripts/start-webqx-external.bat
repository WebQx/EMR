@echo off
REM WebQx Healthcare Platform - External Access Configuration
REM This script starts WebQx services configured for GitHub Pages access

echo ===============================================
echo WebQx Healthcare Platform - External Access
echo ===============================================
echo Starting at: %date% %time%
echo.

REM Get local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    for /f "tokens=1" %%b in ("%%a") do (
        set LOCAL_IP=%%b
        goto :found_ip
    )
)
:found_ip

echo Local IP Address: %LOCAL_IP%
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Set the base directory
set WEBQX_HOME=c:\Users\na210\OneDrive\Documents\GitHub\webqx
cd /d "%WEBQX_HOME%"

echo Current directory: %CD%
echo.

REM Kill any existing Node.js processes
echo Cleaning up any existing Node.js processes...
taskkill /F /IM node.exe >nul 2>nul
timeout /t 2 >nul

echo.
echo Starting WebQx Backend Services for External Access...
echo.

REM Start Authentication Server (Port 3001) - Bind to all interfaces
echo [1/2] Starting Authentication Server on all interfaces (port 3001)...
cd /d "%WEBQX_HOME%\django-auth-backend"
start "WebQx Auth Server" cmd /k "echo Starting WebQx Authentication Server for External Access... && set HOST=0.0.0.0 && node auth-server-social.js"
timeout /t 3

REM Start Frontend Static Server (Port 3000) - Bind to all interfaces  
echo [2/2] Starting Frontend Server on all interfaces (port 3000)...
cd /d "%WEBQX_HOME%"
start "WebQx Frontend Server" cmd /k "echo Starting WebQx Frontend Server for External Access... && set HOST=0.0.0.0 && node static-server.js"
timeout /t 3

echo.
echo ===============================================
echo WebQx Services Started for External Access!
echo ===============================================
echo.
echo Local Access Points:
echo - Main Platform:     http://localhost:3000
echo - Login Page:        http://localhost:3000/login-clean.html
echo - Admin Console:     http://localhost:3000/admin-console/
echo - API Backend:       http://localhost:3001
echo - Health Check:      http://localhost:3001/health/
echo.
echo External Access Points (for GitHub Pages):
echo - Main Platform:     http://%LOCAL_IP%:3000
echo - Login Page:        http://%LOCAL_IP%:3000/login-clean.html
echo - Admin Console:     http://%LOCAL_IP%:3000/admin-console/
echo - API Backend:       http://%LOCAL_IP%:3001
echo - Health Check:      http://%LOCAL_IP%:3001/health/
echo.
echo GitHub Pages Configuration:
echo - Update github-pages-config.js with your IP: %LOCAL_IP%:3001
echo - Ensure Windows Firewall allows Node.js connections
echo - GitHub Pages URL: https://webqx-health.github.io/webqx
echo.
echo Demo Accounts (accessible from GitHub Pages):
echo - Patient:           demo@patient.com / patient123
echo - Physician:         physician@webqx.com / demo123
echo - Provider:          doctor@webqx.com / provider123
echo - Administrator:     admin@webqx.com / admin123
echo.
echo Firewall Configuration:
echo Run these commands as Administrator to allow external access:
echo netsh advfirewall firewall add rule name="WebQX Frontend" dir=in action=allow protocol=TCP localport=3000
echo netsh advfirewall firewall add rule name="WebQX Backend" dir=in action=allow protocol=TCP localport=3001
echo.

REM Check if firewall rules exist
netsh advfirewall firewall show rule name="WebQX Frontend" >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Firewall rules not found. External access may be blocked.
    echo Please run the firewall commands above as Administrator.
    echo.
)

echo Press any key to open the local platform...
pause >nul

REM Open the main platform in default browser
start http://localhost:3000/login-clean.html

echo.
echo WebQx Platform is now running with external access!
echo GitHub Pages users can now connect to: http://%LOCAL_IP%:3001
echo Keep this window open to monitor services.
echo.
pause