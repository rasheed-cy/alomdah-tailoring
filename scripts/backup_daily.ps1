# =====================================================================
# backup_daily.ps1 — النسخ الاحتياطي اليومي التلقائي
# =====================================================================

$ROOT = "E:\Projects\Alomdah_Tailoring"
$backend = "$ROOT\backend"
$logFile = "$ROOT\logs\backup_task.log"

function Write-Log {
    param([string]$Message)
    $time = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$time | $Message" | Out-File -FilePath $logFile -Append -Encoding UTF8
}

try {
    Write-Log "=== بدء النسخ الاحتياطي ==="

    Set-Location $backend
    $python = "$backend\.venv\Scripts\python.exe"

    if (-not (Test-Path $python)) {
        Write-Log "[FAIL] Python غير موجود"
        exit 1
    }

    # شغّل النسخ عبر Python
    $script = @"
import sys
sys.path.insert(0, r'$backend')

from app.database.connection import initialize_pool
from app.db.database import SessionLocal
from app.services.backup_service import BackupService
from app.services.app_settings_service import AppSettingsService

try:
    initialize_pool()
    db = SessionLocal()
    bid, path, msg = BackupService.create_backup(db, backup_type='DAILY')
    
    if path:
        keep = AppSettingsService.get_int(db, 'backup_keep_count', 30)
        BackupService.cleanup_old(db, keep=keep)
        from datetime import datetime
        AppSettingsService.set_many(db, {
            'backup_last_run': datetime.now().isoformat(),
            'backup_last_status': 'SUCCESS',
        })
        print(f'[OK] {msg} | id={bid}')
    else:
        AppSettingsService.set_many(db, {
            'backup_last_status': 'FAILED',
        })
        print(f'[FAIL] {msg}')
        sys.exit(1)
    db.close()
except Exception as e:
    print(f'[ERROR] {e}')
    sys.exit(1)
"@

    $output = & $python -c $script 2>&1 | Out-String
    Write-Log $output

    if ($LASTEXITCODE -eq 0) {
        Write-Log "=== اكتمل بنجاح ==="
    } else {
        Write-Log "=== فشل ==="
    }
} catch {
    Write-Log "[EXCEPTION] $($_.Exception.Message)"
    exit 1
}