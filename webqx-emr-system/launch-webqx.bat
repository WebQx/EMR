@echo off
REM WebQX™ EMR System - Windows Quick Launch Script
REM Automated setup and deployment for Windows

echo.
echo 🚀 WebQX™ EMR System - Quick Launch
echo ==================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker Desktop first.
    echo    After installing Docker Desktop:
    echo    1. Launch Docker Desktop
    echo    2. Wait for Docker to start completely
    echo    3. Run this script again
    echo.
    pause
    exit /b 1
)

echo ✅ Docker is running
echo.

REM Check Docker Compose availability
docker compose version >nul 2>&1
if %errorlevel% equ 0 (
    set "COMPOSE_CMD=docker compose"
) else (
    docker-compose --version >nul 2>&1
    if %errorlevel% equ 0 (
        set "COMPOSE_CMD=docker-compose"
    ) else (
        echo ❌ Docker Compose not found
        pause
        exit /b 1
    )
)

echo ✅ Docker Compose available: %COMPOSE_CMD%
echo.

REM Navigate to script directory
cd /d "%~dp0"

echo 📁 Current directory: %CD%
echo.

REM Pull required images
echo 📥 Pulling Docker images...
%COMPOSE_CMD% pull

echo.
echo 🏗️  Building WebQX EMR container...
%COMPOSE_CMD% build

echo.
echo 🚀 Starting WebQX EMR System...

REM Start with development profile by default
%COMPOSE_CMD% --profile development up -d

echo.
echo ⏳ Waiting for services to be ready...
timeout /t 30 /nobreak >nul

REM Check if services are running
echo.
echo 📊 Service Status:
%COMPOSE_CMD% ps

echo.
echo 🎉 WebQX™ EMR System is ready!
echo.
echo 🌐 Access Points:
echo    📱 WebQX EMR:        http://localhost:8080
echo    🗄️  phpMyAdmin:       http://localhost:8081
echo    🔴 Redis Commander:   http://localhost:8082
echo    📧 Email Testing:     http://localhost:8025
echo.
echo 🔧 Management Commands:
echo    View logs:    %COMPOSE_CMD% logs -f
echo    Stop system:  %COMPOSE_CMD% down
echo    Restart:      %COMPOSE_CMD% restart
echo.
echo 📚 Documentation: DOCKER_README.md
echo.

REM Health check
echo 🏥 Performing health check...
timeout /t 10 /nobreak >nul

curl -s http://localhost:8080 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ WebQX EMR is responding!
) else (
    echo ⚠️  WebQX EMR might still be starting up...
    echo    Check logs: %COMPOSE_CMD% logs webqx-emr
)

echo.
echo 🎊 Your custom WebQX™ EMR system is now running!
echo    Built on OpenEMR 7.0.3 with WebQX enhancements
echo.

REM Open WebQX EMR in default browser
echo 🌐 Opening WebQX EMR in your browser...
start http://localhost:8080

echo.
echo Press any key to continue...
pause >nul
