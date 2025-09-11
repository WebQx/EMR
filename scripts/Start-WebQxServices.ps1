# WebQx Healthcare Platform - Auto-Start PowerShell Script
# Enhanced startup script with error handling and service monitoring

param(
    [switch]$Silent = $false,
    [switch]$AutoStart = $false
)

# Configuration
$WebQxHome = "c:\Users\na210\OneDrive\Documents\GitHub\webqx"
$AuthServerPath = "$WebQxHome\django-auth-backend"
$AuthServerScript = "auth-server-social.js"
$FrontendScript = "static-server.js"
$LogPath = "$WebQxHome\logs"

# Ensure logs directory exists
if (!(Test-Path $LogPath)) {
    New-Item -ItemType Directory -Path $LogPath -Force | Out-Null
}

$LogFile = "$LogPath\webqx-startup-$(Get-Date -Format 'yyyy-MM-dd').log"

function Write-Log {
    param($Message, $Level = "INFO")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "[$Timestamp] [$Level] $Message"
    
    if (!$Silent) {
        switch ($Level) {
            "ERROR" { Write-Host $LogEntry -ForegroundColor Red }
            "WARN"  { Write-Host $LogEntry -ForegroundColor Yellow }
            "SUCCESS" { Write-Host $LogEntry -ForegroundColor Green }
            default { Write-Host $LogEntry -ForegroundColor White }
        }
    }
    
    Add-Content -Path $LogFile -Value $LogEntry
}

function Test-NodeInstallation {
    try {
        $nodeVersion = node --version 2>$null
        if ($nodeVersion) {
            Write-Log "Node.js version detected: $nodeVersion" "SUCCESS"
            return $true
        }
    }
    catch {
        Write-Log "Node.js is not installed or not in PATH" "ERROR"
        return $false
    }
    return $false
}

function Test-Port {
    param($Port)
    try {
        $connection = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
        return $null -ne $connection
    }
    catch {
        return $false
    }
}

function Stop-ExistingServices {
    Write-Log "Stopping any existing WebQx services..."
    
    # Stop Node.js processes
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    
    # Wait for processes to terminate
    Start-Sleep -Seconds 2
    
    # Kill processes using our ports if still occupied
    if (Test-Port 3000) {
        Write-Log "Force killing process on port 3000..."
        $process = Get-NetTCPConnection -LocalPort 3000 -State Listen | Select-Object -ExpandProperty OwningProcess
        Stop-Process -Id $process -Force -ErrorAction SilentlyContinue
    }
    
    if (Test-Port 3001) {
        Write-Log "Force killing process on port 3001..."
        $process = Get-NetTCPConnection -LocalPort 3001 -State Listen | Select-Object -ExpandProperty OwningProcess
        Stop-Process -Id $process -Force -ErrorAction SilentlyContinue
    }
    
    Start-Sleep -Seconds 1
}

function Start-AuthServer {
    Write-Log "Starting Authentication Server..."
    
    if (!(Test-Path "$AuthServerPath\$AuthServerScript")) {
        Write-Log "Authentication server script not found at: $AuthServerPath\$AuthServerScript" "ERROR"
        return $false
    }
    
    try {
        Set-Location $AuthServerPath
        Start-Process -FilePath "node" -ArgumentList $AuthServerScript -WindowStyle Minimized | Out-Null
        
        # Wait and verify the server started
        Start-Sleep -Seconds 5
        
        if (Test-Port 3001) {
            Write-Log "Authentication Server started successfully on port 3001" "SUCCESS"
            return $true
        } else {
            Write-Log "Failed to start Authentication Server" "ERROR"
            return $false
        }
    }
    catch {
        Write-Log "Error starting Authentication Server: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Start-FrontendServer {
    Write-Log "Starting Frontend Server..."
    
    if (!(Test-Path "$WebQxHome\$FrontendScript")) {
        Write-Log "Frontend server script not found at: $WebQxHome\$FrontendScript" "ERROR"
        return $false
    }
    
    try {
        Set-Location $WebQxHome
        Start-Process -FilePath "node" -ArgumentList $FrontendScript -WindowStyle Minimized | Out-Null
        
        # Wait and verify the server started
        Start-Sleep -Seconds 3
        
        if (Test-Port 3000) {
            Write-Log "Frontend Server started successfully on port 3000" "SUCCESS"
            return $true
        } else {
            Write-Log "Failed to start Frontend Server" "ERROR"
            return $false
        }
    }
    catch {
        Write-Log "Error starting Frontend Server: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Test-Services {
    Write-Log "Testing WebQx services..."
    
    # Test backend health
    try {
        $healthResponse = Invoke-WebRequest -Uri "http://localhost:3001/health/" -TimeoutSec 10 -ErrorAction Stop
        if ($healthResponse.StatusCode -eq 200) {
            Write-Log "Backend health check: PASSED" "SUCCESS"
        }
    }
    catch {
        Write-Log "Backend health check: FAILED" "ERROR"
        return $false
    }
    
    # Test frontend
    try {
        $frontendResponse = Invoke-WebRequest -Uri "http://localhost:3000/" -TimeoutSec 10 -ErrorAction Stop
        if ($frontendResponse.StatusCode -eq 200) {
            Write-Log "Frontend health check: PASSED" "SUCCESS"
        }
    }
    catch {
        Write-Log "Frontend health check: FAILED" "ERROR"
        return $false
    }
    
    return $true
}

function Show-ServiceStatus {
    Write-Log "===============================================" "INFO"
    Write-Log "WebQx Healthcare Platform - Service Status" "SUCCESS"
    Write-Log "===============================================" "INFO"
    Write-Log ""
    Write-Log "Access Points:" "INFO"
    Write-Log "- Main Platform:     http://localhost:3000" "INFO"
    Write-Log "- Login Page:        http://localhost:3000/login-clean.html" "INFO"
    Write-Log "- Patient Portal:    http://localhost:3000/patient-portal/" "INFO"
    Write-Log "- Provider Portal:   http://localhost:3000/provider/" "INFO"
    Write-Log "- Admin Console:     http://localhost:3000/admin-console/" "INFO"
    Write-Log "- Telehealth:        http://localhost:3000/telehealth/" "INFO"
    Write-Log "- API Backend:       http://localhost:3001" "INFO"
    Write-Log "- Health Check:      http://localhost:3001/health/" "INFO"
    Write-Log ""
    Write-Log "Demo Accounts:" "INFO"
    Write-Log "- Patient:           demo@patient.com / patient123" "INFO"
    Write-Log "- Physician:         physician@webqx.com / demo123" "INFO"
    Write-Log "- Provider:          doctor@webqx.com / provider123" "INFO"
    Write-Log "- Administrator:     admin@webqx.com / admin123" "INFO"
    Write-Log ""
    Write-Log "Log file: $LogFile" "INFO"
    Write-Log "===============================================" "INFO"
}

# Main execution
try {
    Write-Log "WebQx Healthcare Platform startup initiated"
    
    # Check prerequisites
    if (!(Test-NodeInstallation)) {
        Write-Log "Please install Node.js from https://nodejs.org/" "ERROR"
        exit 1
    }
    
    # Stop existing services
    Stop-ExistingServices
    
    # Start services
    $authStarted = Start-AuthServer
    if (!$authStarted) {
        Write-Log "Failed to start Authentication Server. Aborting." "ERROR"
        exit 1
    }
    
    $frontendStarted = Start-FrontendServer
    if (!$frontendStarted) {
        Write-Log "Failed to start Frontend Server. Aborting." "ERROR"
        exit 1
    }
    
    # Test services
    Start-Sleep -Seconds 5
    $servicesHealthy = Test-Services
    
    if ($servicesHealthy) {
        Show-ServiceStatus
        
        if (!$Silent -and !$AutoStart) {
            Write-Log ""
            Write-Log "Opening WebQx Platform in default browser..." "INFO"
            Start-Process "http://localhost:3000/login-clean.html"
        }
        
        Write-Log "WebQx Platform startup completed successfully!" "SUCCESS"
        exit 0
    } else {
        Write-Log "WebQx Platform startup completed with errors. Check logs for details." "WARN"
        exit 1
    }
}
catch {
    Write-Log "Critical error during startup: $($_.Exception.Message)" "ERROR"
    exit 1
}
finally {
    if (!$AutoStart) {
        Write-Log ""
        Write-Log "Press Enter to continue..." "INFO"
        Read-Host
    }
}
