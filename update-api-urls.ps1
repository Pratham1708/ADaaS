# Update all localhost:8000 fallbacks to Render backend URL (excluding .next folder)

$files = Get-ChildItem -Path "frontend" -Recurse -Include "*.tsx","*.ts","*.jsx","*.js" | Where-Object { $_.FullName -notlike "*\.next*" -and $_.FullName -notlike "*\node_modules\*" }

$count = 0
foreach ($file in $files) {
    try {
        $content = Get-Content $file.FullName -ErrorAction Stop
        $newContent = $content -replace "process\.env\.NEXT_PUBLIC_API_URL \|\| 'http://localhost:8000'", "process.env.NEXT_PUBLIC_API_URL || 'https://adaas-backend.onrender.com'"
        
        if (($content | Out-String) -ne ($newContent | Out-String)) {
            Set-Content -Path $file.FullName -Value $newContent
            Write-Host "Updated: $($file.Name)"
            $count++
        }
    } catch {
        Write-Host "Skipped (error): $($file.Name)" -ForegroundColor Yellow
    }
}

Write-Host "`nDone! Updated $count files."
