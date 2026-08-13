@echo off
setlocal
set ROOT=%~dp0..
set GODOT=
if defined GODOT goto have
if exist "%ROOT%\tools\godot\Godot_v4.6.3-stable_win64.exe" set GODOT=%ROOT%\tools\godot\Godot_v4.6.3-stable_win64.exe
if exist "%ROOT%\tools\godot\godot.exe" set GODOT=%ROOT%\tools\godot\godot.exe
:have
if "%GODOT%"=="" (
  echo Godot 4.6.3 not found. Run scripts\fetch-godot.ps1 once ^(needs network^), then this .bat is offline.
  exit /b 127
)
echo AETHERA  engine: %GODOT%
echo Saves in %ROOT%\saves
"%GODOT%" --path "%ROOT%\game" --rendering-method gl_compatibility %*
