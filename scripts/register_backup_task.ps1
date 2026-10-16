# =====================================================================
# register_backup_task.ps1 - Register daily backup task
# =====================================================================

param(
    [string]$Time = "02:00",
    [int]$KeepCount = 30
)

$ROOT = "E:\Projects\Alomdah_Tailoring"
$scriptPath = "$ROOT\scripts\backup_daily.ps1"
$taskName = "Alomdah_Daily_Backup"

# Delete old task if exists
schtasks /query /tn $taskName 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) {
    schtasks /delete /tn $taskName /f 2>$null | Out-Null
    Write-Host "[INFO] Old task deleted" -ForegroundColor Yellow
}

# Check script exists
if (-not (Test-Path $scriptPath)) {
    Write-Host "[FAIL] Script not found: $scriptPath" -ForegroundColor Red
    exit 1
}

# Command
$command = "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$scriptPath`""

# Create task
$result = schtasks /create /tn $taskName /tr $command /sc DAILY /st $Time /rl HIGHEST /f 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Task registered: $taskName" -ForegroundColor Green
    Write-Host "[OK] Time: $Time" -ForegroundColor Green
    Write-Host "[INFO] Will run even when app is closed" -ForegroundColor Cyan
    exit 0
} else {
    Write-Host "[FAIL] Registration failed" -ForegroundColor Red
    Write-Host $result -ForegroundColor Yellow
    exit 1
}