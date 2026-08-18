@echo off
setlocal enabledelayedexpansion
title AFTIS PRO - Synthetic HFT Simulation Terminal
echo =====================================================================
echo  TWIG D. CAPRA: AFTIS - OFFLINE HFT SIMULATOR
echo  ENGINE: Multivariate Hawkes Process Microstructure
echo =====================================================================

where npm >nul 2>nul || (echo [ERROR] Node.js npm is missing from PATH. & pause & exit /b 1)

cd /d "%~dp0..\src-ui"
call npm install
echo [INFO] Launching AFTIS in SIMULATION MODE (50k synthetic events/sec)...
call npm run tauri dev -- -- --mode=simulation --synthetic-rate=50000
