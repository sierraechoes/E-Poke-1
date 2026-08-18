Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Cleaning and Rebuilding AFTIS System Workspace" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

Set-Location -Path "$PSScriptRoot\.."
Write-Host "[1/5] Cleaning Rust build artifacts..." -ForegroundColor Yellow
if (Test-Path "src-ui\src-tauri\target") { Remove-Item -Recurse -Force "src-ui\src-tauri\target" }

Write-Host "[2/5] Cleaning UI build artifacts..." -ForegroundColor Yellow
Set-Location -Path "src-ui"
if (Test-Path "node_modules") { Remove-Item -Recurse -Force "node_modules" }
if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }

Write-Host "[3/5] Installing UI dependencies..." -ForegroundColor Yellow
npm install

Write-Host "[4/5] Executing verification test suite..." -ForegroundColor Yellow
Set-Location -Path ".."
npm run test
if ($LASTEXITCODE -ne 0) { Write-Host "TESTS FAILED." -ForegroundColor Red; exit 1 }

Write-Host "[5/5] Building distribution (.msi/.exe installer)..." -ForegroundColor Yellow
Set-Location -Path "src-ui"
npm run tauri build

Write-Host "BUILD COMPLETE. Installer generated in src-ui\src-tauri\target\release\bundle\msi\" -ForegroundColor Green
