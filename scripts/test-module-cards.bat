@echo off
REM WebQX Module Placement Cards EMR Communication Test
REM This script runs comprehensive tests for all module cards in patient and provider panels

echo ===============================================
echo WebQX Module Placement Cards EMR Test
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

REM Check if test files exist
if not exist "__tests__\module-placement-cards-emr-test.js" (
    echo ERROR: Test file not found
    echo Expected: __tests__\module-placement-cards-emr-test.js
    pause
    exit /b 1
)

if not exist "scripts\test-module-cards.js" (
    echo ERROR: Test runner not found
    echo Expected: scripts\test-module-cards.js
    pause
    exit /b 1
)

echo ===============================================
echo Running Module Placement Cards EMR Test
echo ===============================================
echo.

REM Run the test with the test runner
echo Starting test execution...
node scripts\test-module-cards.js --verbose

REM Check test result
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===============================================
    echo ✅ ALL TESTS PASSED!
    echo ===============================================
    echo.
    echo Test Categories Completed:
    echo   📱 Patient Portal Module Cards
    echo   👨‍⚕️ Provider Portal Module Cards  
    echo   🏥 EMR Integration Testing
    echo   🩺 Specialty Modules Testing
    echo   🔗 Interoperability Testing
    echo   ⚡ Real-time Updates Testing
    echo   🛡️ Error Handling Testing
    echo.
) else (
    echo.
    echo ===============================================
    echo ❌ SOME TESTS FAILED
    echo ===============================================
    echo.
    echo Please review the test output above for details.
    echo Check the test report for more information.
    echo.
)

echo Test completed at: %date% %time%
echo.

REM Show test report location if it exists
if exist "test-reports\module-cards-test-report.json" (
    echo 📄 Test report available at:
    echo    test-reports\module-cards-test-report.json
    echo.
)

echo Module Cards Tested:
echo.
echo PATIENT PORTAL:
echo   📅 Appointments - EMR scheduling integration
echo   📋 Medical Records - EHR data retrieval
echo   💊 Prescriptions - Pharmacy system integration
echo   🧪 Lab Results - Laboratory data integration
echo   🎥 Telehealth - Video consultation system
echo   💬 Messages - Secure messaging system
echo.
echo PROVIDER PORTAL:
echo   🏥 OpenEMR Patient Management - Full EHR integration
echo   📅 OpenEMR Scheduling - FHIR appointment system
echo   📋 OpenEMR Clinical Data - Clinical data management
echo   📹 Telehealth Console - Provider video system
echo   💊 Prescription Management - RxNorm integration
echo   🧠 Clinical Decision Support - AI-powered insights
echo.
echo SPECIALTY MODULES:
echo   🫀 Primary Care, Cardiology, Radiology
echo   🧠 Oncology, Psychiatry, Pediatrics
echo   🦴 Dermatology, Orthopedics, Neurology
echo   🫁 Gastroenterology, Pulmonology, OBGYN
echo.

echo Press any key to exit...
pause >nul