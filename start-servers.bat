@echo off
echo Starting WebQX EMR Servers...
echo.

REM Start WebQX EMR System Server (Port 8080)
echo Starting WebQX EMR System on port 8080...
start "WebQX EMR System" cmd /k "cd /d webqx-emr-system && node server.js"

REM Wait 2 seconds
timeout /t 2 /nobreak >nul

REM Start OpenEMR Integration Server (Port 3002)
echo Starting OpenEMR Integration Server on port 3002...
start "OpenEMR Integration" cmd /k "cd /d core && node openemr-server.js"

echo.
echo ========================================
echo WebQX Servers Started Successfully!
echo ========================================
echo.
echo 🏥 WebQX EMR System:     http://localhost:8080
echo 🔌 OpenEMR Integration:  http://localhost:3002
echo 📊 Health Check:         http://localhost:3002/health
echo 🔐 FHIR API:             http://localhost:3002/fhir/metadata
echo.
echo Press any key to open WebQX EMR System...
pause >nul
start http://localhost:8080