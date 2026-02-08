# --- Configuration ---
$InstructionFile = "TODO.md"
$ClaudePath = "C:\Users\esken\.local\bin\claude.exe"
$PollIntervalSeconds = 30

Write-Host "--- Claude Remote Watcher Active ---" -ForegroundColor Cyan
Write-Host "Monitoring: $InstructionFile"
Write-Host "Timezone: Jerusalem (Bet Shemesh)"

while($true) {
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Checking GitHub..." -ForegroundColor Gray
    
    # 1. Pull changes from GitHub (Phone Edits)
    git pull origin main --quiet

    # 2. Check if the instruction file was modified in the last 45 seconds
    $file = Get-Item $InstructionFile -ErrorAction SilentlyContinue
    if ($file -and $file.LastWriteTime -gt (Get-Date).AddSeconds(-($PollIntervalSeconds + 15))) {
        
        Write-Host "New instructions found! Executing Claude..." -ForegroundColor Yellow
        
        # 3. Run Claude in 'YOLO' mode
        # -p passes the prompt, --dangerously-skip-permissions bypasses all 'Yes/No' prompts
        & $ClaudePath -p "Read $InstructionFile and implement the requested changes. Reference CLAUDE.md for rules." --dangerously-skip-permissions

        # 4. Push results back so you can see them on your phone
        git add .
        git commit -m "AI: Task completed from mobile instruction" --quiet
        git push origin main --quiet
        
        Write-Host "Task complete. Changes pushed back to GitHub." -ForegroundColor Green
    }

    # Wait for the next check
    Start-Sleep -Seconds $PollIntervalSeconds
}