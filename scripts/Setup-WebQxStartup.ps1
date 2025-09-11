# WebQx Healthcare Platform - Windows Task Scheduler Setup
# Creates a scheduled task to start WebQx services at Windows startup

param(
    [switch]$Remove
)

$TaskName = "WebQx Healthcare Platform Auto-Start"
$WebQxHome = "c:\Users\na210\OneDrive\Documents\GitHub\webqx"
$ScriptPath = "$WebQxHome\scripts\Start-WebQxServices.ps1"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "WebQx Windows Startup Task Manager" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($Remove) {
    # Remove existing task
    Write-Host "Removing WebQx startup task..." -ForegroundColor Yellow
    
    try {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction Stop
        Write-Host "✅ SUCCESS: WebQx startup task removed successfully!" -ForegroundColor Green
        Write-Host "WebQx will no longer start automatically with Windows." -ForegroundColor White
    } catch {
        Write-Host "❌ Task '$TaskName' not found or already removed." -ForegroundColor Red
    }
} else {
    # Create/Update startup task
    Write-Host "Setting up WebQx automatic startup task..." -ForegroundColor Yellow
    
    # Remove existing task if it exists
    try {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
        Write-Host "Removed existing task" -ForegroundColor Gray
    } catch {
        # Task doesn't exist, continue
    }
    
    # Create new task
    try {
        # Define the action
        $Action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-WindowStyle Hidden -ExecutionPolicy Bypass -File `"$ScriptPath`" -Silent -DelaySeconds 10"
        
        # Define the trigger (at startup with 30 second delay)
        $Trigger = New-ScheduledTaskTrigger -AtStartup
        $Trigger.Delay = "PT30S"  # 30 second delay after startup
        
        # Define settings
        $Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -DontStopOnIdleEnd
        $Settings.ExecutionTimeLimit = "PT0S"  # No time limit
        $Settings.RestartCount = 3
        $Settings.RestartInterval = "PT1M"  # Restart every minute if fails
        
        # Define principal (run with highest privileges)
        $Principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
        
        # Register the task
        Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Principal $Principal -Description "Automatically starts WebQx Healthcare Platform services at Windows startup"
        
        Write-Host "✅ SUCCESS: WebQx startup task created successfully!" -ForegroundColor Green
        Write-Host "`nTask Details:" -ForegroundColor Cyan
        Write-Host "• Task Name: $TaskName" -ForegroundColor White
        Write-Host "• Trigger: At Windows startup (30 second delay)" -ForegroundColor White
        Write-Host "• Script: $ScriptPath" -ForegroundColor White
        Write-Host "• Auto-restart: Yes (up to 3 times)" -ForegroundColor White
        
        Write-Host "`nServices that will start automatically:" -ForegroundColor Cyan
        Write-Host "• Authentication Backend Server (Port 3001)" -ForegroundColor White
        Write-Host "• Frontend Static Server (Port 3000)" -ForegroundColor White
        Write-Host "• Main Application Server (Port 8080)" -ForegroundColor White
        
        Write-Host "`nAccess URLs after startup:" -ForegroundColor Cyan
        Write-Host "• EMR Platform: http://localhost:3000/index-clean.html" -ForegroundColor White
        Write-Host "• Login Portal: http://localhost:3000/login-clean.html" -ForegroundColor White
        Write-Host "• Telehealth: http://localhost:3000/telehealth/" -ForegroundColor White
        
    } catch {
        Write-Host "❌ ERROR: Failed to create startup task" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "`nTry running this script as Administrator." -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Task Management Commands:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "• View task: Get-ScheduledTask -TaskName '$TaskName'" -ForegroundColor White
Write-Host "• Start now: Start-ScheduledTask -TaskName '$TaskName'" -ForegroundColor White
Write-Host "• Remove task: .\Setup-WebQxStartup.ps1 -Remove" -ForegroundColor White
Write-Host "• Manual start: .\Start-WebQxServices.ps1" -ForegroundColor White

Write-Host "`nPress any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
