# --- Configuration ---
$ProjectRoot = "C:\Code\2048-custom-pwa"
$InstructionFile = "TODO.md"
$ClaudePath = "C:\Users\esken\.local\bin\claude.exe"
$PollIntervalSeconds = 30

# Change to project directory
Set-Location $ProjectRoot

Write-Host "--- Claude Remote Watcher Active ---" -ForegroundColor Cyan
Write-Host "Working Directory: $ProjectRoot"
Write-Host "Monitoring: $InstructionFile"
Write-Host "Timezone: Jerusalem (Bet Shemesh)"

while($true) {
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Checking GitHub..." -ForegroundColor Gray
    
    # 1. Pull changes from GitHub (Phone Edits)
    git pull origin main --quiet

    # 2. Check if the instruction file was modified in the last 45 seconds
    $file = Get-Item $InstructionFile -ErrorAction SilentlyContinue
    if ($file -and $file.LastWriteTime -gt (Get-Date).AddSeconds(-($PollIntervalSeconds + 15))) {

        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] New instructions found! Executing Claude..." -ForegroundColor Yellow

        # Log usage for cost tracking
        $taskPreview = (Get-Content $InstructionFile -TotalCount 1 -ErrorAction SilentlyContinue) ?? "No preview"
        $logEntry = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Claude invoked | Task: $taskPreview"
        Add-Content -Path "claude-usage.log" -Value $logEntry

        # 3. Run Claude in 'YOLO' mode
        # -p passes the prompt, --dangerously-skip-permissions bypasses all 'Yes/No' prompts
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Running Claude Code..." -ForegroundColor Cyan

        # Start Claude as a background job
        $job = Start-Job -ScriptBlock {
            param($Path, $ProjectDir, $Instruction)
            Set-Location $ProjectDir
            Write-Output "Working directory: $(Get-Location)"
            Write-Output "Running: $Path -p 'Read $Instruction...'"
            & $Path -p "Read $Instruction and implement the requested changes. Reference CLAUDE.md for rules." --dangerously-skip-permissions 2>&1
        } -ArgumentList $ClaudePath, $ProjectRoot, $InstructionFile

        # Show progress while Claude is running
        $dots = 0
        while ($job.State -eq 'Running') {
            $dots = ($dots + 1) % 4
            $dotString = "." * $dots
            Write-Host "`r[$(Get-Date -Format 'HH:mm:ss')] Claude is working$dotString   " -NoNewline -ForegroundColor Gray
            Start-Sleep -Seconds 2
        }
        Write-Host ""  # New line after progress

        # Get the result
        $result = Receive-Job -Job $job -Wait
        Remove-Job -Job $job

        # Show Claude output if any
        if ($result) {
            Write-Host $result -ForegroundColor White
        } else {
            Write-Host "Warning: No output from Claude!" -ForegroundColor Red
        }

        # 4. Check if there are changes to commit
        $changesExist = git status --porcelain
        if (-not $changesExist) {
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ERROR: Claude ran but made no changes!" -ForegroundColor Red
            Write-Host "Skipping commit. TODO.md NOT cleared. Check the task and try again." -ForegroundColor Yellow
            continue
        }

        # Push results back so you can see them on your phone
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Committing changes..." -ForegroundColor Cyan
        git add .
        git commit -m "AI: Task completed from mobile instruction"

        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Pushing to GitHub..." -ForegroundColor Cyan
        git push origin main

        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Task complete. Changes pushed to GitHub." -ForegroundColor Green

        # Clear the instruction file to prevent re-running the same task
        Clear-Content $InstructionFile
        git add $InstructionFile
        git commit -m "Clear TODO.md after task completion"
        git push origin main
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Cleared $InstructionFile - ready for next task." -ForegroundColor Cyan
    }

    # Wait for the next check
    Start-Sleep -Seconds $PollIntervalSeconds
}