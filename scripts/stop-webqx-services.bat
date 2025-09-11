@echo off
REM WebQx Healthcare Platform - Stop Services
REM This script stops all WebQx services

echo ===============================================
echo WebQx Healthcare Platform - Stopping Services
echo ===============================================
echo Stopping at: %date% %time%
echo.

echo Stopping all Node.js processes...
taskkill /F /IM node.exe >nul 2>nul

echo Stopping any WebQx related processes...
taskkill /F /FI "WINDOWTITLE:WebQx*" >nul 2>nul

REM Wait a moment for processes to terminate
timeout /t 2 >nul

REM Check if ports are still in use
echo Checking port status...
netstat -an | findstr :3000 >nul
if %ERRORLEVEL% EQU 0 (
    echo Warning: Port 3000 may still be in use
) else (
    echo Port 3000: Available
)

netstat -an | findstr :3001 >nul
if %ERRORLEVEL% EQU 0 (
    echo Warning: Port 3001 may still be in use
) else (
    echo Port 3001: Available
)

echo.
echo ===============================================
echo WebQx Services Stopped Successfully!
echo ===============================================
echo.
pause
