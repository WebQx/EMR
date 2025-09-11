@echo off
REM WebQX EMR - Portable PHP Launcher
REM No installation required - runs immediately!

echo.
echo WebQX EMR System - Portable Launch
echo ======================================
echo.

REM Check if portable PHP exists
if not exist ".\portable-php\php.exe" (
    echo Setting up portable PHP for WebQX EMR...
    
    REM Create portable directory
    if not exist "portable-php" mkdir portable-php
    
    echo Downloading PHP 8.3 portable...
    powershell -Command "Invoke-WebRequest -Uri 'https://windows.php.net/downloads/releases/php-8.3.11-Win32-vs16-x64.zip' -OutFile 'portable-php.zip'"
    
    echo Extracting PHP...
    powershell -Command "Expand-Archive -Path 'portable-php.zip' -DestinationPath 'portable-php' -Force"
    
    echo Configuring PHP for WebQX...
    copy "portable-php\php.ini-development" "portable-php\php.ini" >nul
    
    echo Portable PHP ready!
    del portable-php.zip >nul 2>&1
)

echo.
echo Starting WebQX EMR Development Server...
echo.
echo WebQX EMR will be available at:
echo    http://localhost:8080
echo.
echo Features Available:
echo    - Complete OpenEMR integration
echo    - WebQX custom branding  
echo    - API endpoints
echo    - Development mode
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start WebQX EMR using portable PHP
cd /d "%~dp0"
portable-php\php.exe -S localhost:8080 dev-server.php

echo.
echo WebQX EMR Development Server stopped
pause
