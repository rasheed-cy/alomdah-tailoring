# =====================================================================
# unregister_backup_task.ps1 — إلغاء مهمة النسخ
# =====================================================================

$taskName = "Alomdah_Daily_Backup"

schtasks /query /tn $taskName 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) {
    schtasks /delete /tn $taskName /f 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] تم إلغاء المهمة: $taskName" -ForegroundColor Green
        exit 0
    } else {
        Write-Host "[FAIL] فشل الإلغاء" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[SKIP] المهمة غير موجودة" -ForegroundColor Yellow
    exit 0
}