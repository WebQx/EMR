@echo off
REM WebQX™ EMR Quick Development Server
REM For immediate testing while Docker issues are resolved

echo.
echo 🚀 WebQX™ EMR Development Server
echo ================================
echo.

REM Check if PHP is available
php --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ PHP is not installed or not in PATH
    echo.
    echo 📥 Installing PHP using Chocolatey...
    powershell -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))"
    choco install php -y
    
    if %errorlevel% neq 0 (
        echo ❌ Failed to install PHP. Please install PHP manually.
        pause
        exit /b 1
    )
)

echo ✅ PHP is available
php --version

echo.
echo 🌐 Starting WebQX EMR Development Server...
echo.
echo 📱 WebQX EMR will be available at:
echo    http://localhost:8080
echo.
echo 🔧 Development Features:
echo    - Hot reload for file changes
echo    - Debug mode enabled
echo    - API endpoints available
echo    - Static file serving
echo.
echo 🛑 Press Ctrl+C to stop the server
echo.

REM Start PHP development server
cd /d "%~dp0"
php -S localhost:8080 dev-server.php

echo.
echo 🛑 WebQX EMR Development Server stopped
pause
