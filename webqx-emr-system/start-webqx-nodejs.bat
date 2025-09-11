@echo off
REM WebQX™ EMR System - Node.js Portable Launcher
REM Downloads Node.js automatically and starts your EMR system

echo.
echo WebQX EMR System - Node.js Edition
echo ===================================
echo.

REM Check if portable Node.js exists
if not exist ".\nodejs\node.exe" (
    echo Setting up portable Node.js for WebQX EMR...
    
    echo Downloading Node.js v20.17.0 portable...
    powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.17.0/node-v20.17.0-win-x64.zip' -OutFile 'node.zip'"
    
    echo Extracting Node.js...
    powershell -Command "Expand-Archive -Path 'node.zip' -DestinationPath '.' -Force"
    
    echo Setting up Node.js directory...
    move "node-v20.17.0-win-x64" "nodejs" >nul 2>&1
    del node.zip >nul 2>&1
    
    echo Node.js portable setup complete!
)

echo.
echo Starting WebQX EMR Development Server...
echo.
echo WebQX EMR will be available at:
echo    http://localhost:8080
echo.
echo Features Available:
echo    - Complete EMR interface
echo    - Patient management dashboard  
echo    - FHIR R4 API endpoints
echo    - Appointment system
echo    - WebQX custom branding
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start WebQX EMR using portable Node.js
cd /d "%~dp0"
nodejs\node.exe server.js

echo.
echo WebQX EMR Development Server stopped
pause
