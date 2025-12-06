# ADaaS Startup Script - Manual Mode (No Docker)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ADaaS - Manual Startup" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if backend is already running
Write-Host "Checking if backend is running..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method Get -ErrorAction Stop
    Write-Host "✓ Backend is already running on port 8000" -ForegroundColor Green
} catch {
    Write-Host "✗ Backend not running. Please start it manually." -ForegroundColor Red
    Write-Host "`nTo start backend, open a NEW terminal and run:" -ForegroundColor Yellow
    Write-Host "  cd e:\ADAAS\backend" -ForegroundColor White
    Write-Host "  uvicorn app.main:app --reload --port 8000`n" -ForegroundColor White
}

# Check if frontend is running
Write-Host "`nChecking if frontend is running..." -ForegroundColor Yellow
try {
    $frontend = Invoke-WebRequest -Uri "http://localhost:3000" -Method Get -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✓ Frontend is running on port 3000" -ForegroundColor Green
} catch {
    try {
        $frontend = Invoke-WebRequest -Uri "http://localhost:3001" -Method Get -TimeoutSec 2 -ErrorAction Stop
        Write-Host "✓ Frontend is running on port 3001" -ForegroundColor Green
    } catch {
        Write-Host "✗ Frontend not running. Please start it manually." -ForegroundColor Red
        Write-Host "`nTo start frontend, open a NEW terminal and run:" -ForegroundColor Yellow
        Write-Host "  cd e:\ADAAS\frontend" -ForegroundColor White
        Write-Host "  npm run dev`n" -ForegroundColor White
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Access Points" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Frontend:  http://localhost:3000 or http://localhost:3001" -ForegroundColor White
Write-Host "Backend:   http://localhost:8000" -ForegroundColor White
Write-Host "API Docs:  http://localhost:8000/docs" -ForegroundColor White
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "ADaaS is ready! Use the access points above to interact with the application." -ForegroundColor Green
