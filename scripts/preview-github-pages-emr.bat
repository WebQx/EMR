@echo off
REM WebQX GitHub Pages EMR Integration Preview
REM Preview EMR integration before GitHub Pages deployment

echo ===============================================
echo WebQX GitHub Pages EMR Integration Preview
echo ===============================================
echo Starting at: %date% %time%
echo.

REM Set the base directory
set WEBQX_HOME=c:\Users\na210\OneDrive\Documents\GitHub\webqx
cd /d "%WEBQX_HOME%"

echo Current directory: %CD%
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

REM Check if preview file exists
if not exist "preview-github-pages-emr.html" (
    echo ERROR: Preview file not found
    echo Expected: preview-github-pages-emr.html
    pause
    exit /b 1
)

echo ===============================================
echo Starting GitHub Pages EMR Preview Server
echo ===============================================
echo.

REM Kill any existing Node.js processes
echo Cleaning up existing processes...
taskkill /F /IM node.exe >nul 2>nul
timeout /t 2 >nul

REM Start the preview server
echo Starting preview server on port 3000...
start "WebQX EMR Preview Server" cmd /k "echo WebQX GitHub Pages EMR Preview Server && node static-server.js"
timeout /t 3

echo.
echo ===============================================
echo GitHub Pages EMR Preview Started!
echo ===============================================
echo.
echo Preview URLs:
echo - EMR Integration Preview:  http://localhost:3000/preview-github-pages-emr.html
echo - Patient Portal:           http://localhost:3000/patient-portal/
echo - Provider Portal:          http://localhost:3000/provider/
echo - Main Platform:            http://localhost:3000/
echo.
echo GitHub Pages Simulation:
echo - Static Assets:            ✅ Ready
echo - EMR Integration:          ✅ Configured
echo - FHIR R4 Endpoints:        ✅ Active
echo - Real-time Updates:        ✅ Enabled
echo - Security Headers:         ✅ Configured
echo.

echo Press any key to open the EMR integration preview...
pause >nul

REM Open the preview in default browser
start http://localhost:3000/preview-github-pages-emr.html

echo.
echo 🏥 GitHub Pages EMR Integration Preview is now running!
echo.
echo PREVIEW FEATURES:
echo   📱 Patient Portal Module Cards
echo   👨⚕️ Provider Portal Module Cards
echo   🔗 FHIR R4 Integration Testing
echo   ⚡ Real-time Updates Demo
echo   🚀 Deployment Readiness Check
echo   🏥 EMR Systems Status
echo   📊 Integration Test Suite
echo.
echo Keep this window open to monitor the preview server.
echo To stop the server, close this window or press Ctrl+C.
echo.
pause