# --- Configuration ---
$ProjectRoot = "C:\Code\2048-custom-pwa"
$InstructionFile = "TODO.md"
$ClaudePath = "C:\Users\esken\.local\bin\claude.exe"
$NormalPollSeconds = 30      # Normal: check every 30 seconds
$BackoffPollSeconds = 300    # After limit: wait 5 minutes

$currentInterval = $NormalPollSeconds

Set-Location $ProjectRoot

Write-Host "--- Claude Remote Watcher (30s/5m adaptive) ---" -ForegroundColor Cyan
Write-Host "Monitoring: $InstructionFile"
Write-Host "Normal polling: ${NormalPollSeconds}s | Backoff: ${BackoffPollSeconds}s"

while($true) {
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Checking GitHub..." -ForegroundColor Gray
    git pull origin main --quiet

    $file = Get-Item $InstructionFile -ErrorAction SilentlyContinue
    # Checks if TODO.md has content and was updated recently
    if ($file -and $file.Length -gt 0 -and $file.LastWriteTime -gt (Get-Date).AddSeconds(-($currentInterval + 60))) {

        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] New instructions found! Executing Claude..." -ForegroundColor Yellow

        # Show task preview
        $taskContent = Get-Content $InstructionFile -Raw
        Write-Host "Task:" -ForegroundColor Cyan
        Write-Host $taskContent -ForegroundColor White
        Write-Host "---" -ForegroundColor Gray

        $job = Start-Job -ScriptBlock {
            param($Path, $ProjectDir, $Instruction)
            Set-Location $ProjectDir
            & $Path -p "Read $Instruction and implement the requested changes. Reference CLAUDE.md for rules." --dangerously-skip-permissions 2>&1
        } -ArgumentList $ClaudePath, $ProjectRoot, $InstructionFile

        while ($job.State -eq 'Running') {
            Write-Host "." -NoNewline -ForegroundColor Gray
            Start-Sleep -Seconds 5
        }
        Write-Host ""

        $result = Receive-Job -Job $job -Wait
        Remove-Job -Job $job

        # --- Usage Limit Detection ---
        if ($result -match "usage limit" -or $result -match "resets") {
            Write-Host "[!] CLAUDE LIMIT REACHED: $result" -ForegroundColor Magenta
            Write-Host "Task preserved in $InstructionFile. Switching to 5-minute polling..." -ForegroundColor Gray
            $currentInterval = $BackoffPollSeconds  # Switch to backoff mode
            continue # Skips the commit/clear phase so the task remains for next time
        }

        # --- Standard Success Check ---
        $changesExist = git status --porcelain
        if (-not $changesExist) {
            Write-Host "[?] No code changes detected. Check your TODO.md instructions." -ForegroundColor Yellow
            continue
        }

        # Credits available! Return to normal polling
        $currentInterval = $NormalPollSeconds

        # Commit and Push
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Task successful. Pushing results..." -ForegroundColor Green
        git add .
        git commit -m "AI: Task completed from mobile instruction"
        git push origin main

        # Clear file ONLY after verified success
        Clear-Content $InstructionFile
        git add $InstructionFile
        git commit -m "System: Cleared TODO.md"
        git push origin main
        Write-Host "Ready for next task." -ForegroundColor Cyan
    }

    Start-Sleep -Seconds $currentInterval
}