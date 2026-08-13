@echo off
setlocal
set ROOT=%~dp0..
set GODOT=
if exist "%ROOT%\tools\godot\Godot_v4.6.3-stable_win64.exe" set GODOT=%ROOT%\tools\godot\Godot_v4.6.3-stable_win64.exe
if exist "%ROOT%\tools\godot\godot.exe" set GODOT=%ROOT%\tools\godot\godot.exe
if "%GODOT%"=="" (
  echo Godot 4.6.3 not found. Run scripts\fetch-godot.ps1 once.
  exit /b 127
)
"%GODOT%" --editor --path "%ROOT%\game" %*
