# One-time download of official Godot 4.6.3 for Windows. Then play offline.
$ErrorActionPreference = "Stop"
$Version = "4.6.3"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Dest = Join-Path $Root "tools\godot"
New-Item -ItemType Directory -Force -Path $Dest | Out-Null

$exe = Join-Path $Dest "Godot_v$Version-stable_win64.exe"
if (Test-Path $exe) {
    Write-Host "Godot $Version already present."
    exit 0
}

$asset = "Godot_v$Version-stable_win64.exe.zip"
$url = "https://github.com/godotengine/godot/releases/download/$Version-stable/$asset"
$zip = Join-Path $env:TEMP $asset
Write-Host "Downloading $url"
Invoke-WebRequest -Uri $url -OutFile $zip
Expand-Archive -Path $zip -DestinationPath $Dest -Force
Remove-Item $zip -Force
Write-Host "Installed $exe"
Write-Host "Run .\scripts\play.bat offline."
