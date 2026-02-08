# Claude Usage Statistics Viewer

$logFile = "claude-usage.log"

if (-not (Test-Path $logFile)) {
    Write-Host "No usage log found yet. The log will be created when Claude is first invoked." -ForegroundColor Yellow
    exit
}

Write-Host "`n=== Claude Usage Statistics ===" -ForegroundColor Cyan

# Total invocations
$totalInvocations = (Get-Content $logFile).Count
Write-Host "`nTotal Claude invocations: $totalInvocations" -ForegroundColor Green

# Today's invocations
$today = Get-Date -Format "yyyy-MM-dd"
$todayInvocations = (Get-Content $logFile | Select-String $today).Count
Write-Host "Today's invocations: $todayInvocations" -ForegroundColor Yellow

# This week's invocations
$weekAgo = (Get-Date).AddDays(-7).ToString("yyyy-MM-dd")
$thisWeekInvocations = (Get-Content $logFile | Select-String -Pattern "\[$([regex]::Escape(((Get-Date).AddDays(-7).ToString('yyyy-MM-dd')))).*\]" -AllMatches).Count
Write-Host "This week's invocations: $thisWeekInvocations" -ForegroundColor Magenta

# Recent tasks (last 10)
Write-Host "`n=== Recent Tasks ===" -ForegroundColor Cyan
Get-Content $logFile -Tail 10 | ForEach-Object {
    Write-Host $_ -ForegroundColor Gray
}

# Estimated cost (rough estimate: ~$0.015 per invocation for Sonnet 4.5)
$estimatedCost = $totalInvocations * 0.015
Write-Host "`n=== Cost Estimate ===" -ForegroundColor Cyan
Write-Host "Estimated total cost: `$$([math]::Round($estimatedCost, 2))" -ForegroundColor Yellow
Write-Host "(Based on ~`$0.015 per task - actual cost varies by token usage)" -ForegroundColor Gray

Write-Host "`nFor accurate costs, visit: https://console.anthropic.com/settings/usage`n" -ForegroundColor Gray
