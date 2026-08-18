@echo off
setlocal enabledelayedexpansion
title AFTIS PRO - Live Production Terminal
echo =====================================================================
echo  TWIG D. CAPRA: ADVANCED FUTURES TRADING INTEGRATED SYSTEMS (AFTIS)
echo  MODE: LIVE PRODUCTION ENGINE
echo =====================================================================

where cargo >nul 2>nul || (echo [ERROR] Rust cargo is missing from PATH. & pause & exit /b 1)
where npm >nul 2>nul || (echo [ERROR] Node.js npm is missing from PATH. & pause & exit /b 1)

cd /d "%~dp0..\src-ui"
if not exist "src-tauri\target\release\aftis-desktop.exe" (
    echo [INFO] Compiling release binaries ^(this takes several minutes the first time^)...
    call npm install
    call npm run tauri build
)

echo [INFO] Launching AFTIS in LIVE MODE...
call npm run tauri dev -- -- --mode=live
