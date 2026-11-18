@echo off
setlocal
pushd "%~dp0" || exit /b 1
powershell.exe -NoLogo -NoProfile -Command "$ErrorActionPreference='Stop'; $url='http://127.0.0.1:4317'; function Ready { try { (Invoke-RestMethod -Uri ($url+'/api/health') -TimeoutSec 2).ready -eq $true } catch { $false } }; if (-not (Ready)) { $env:PORT='4317'; $p=Start-Process -FilePath (Get-Command node.exe).Source -ArgumentList 'scripts/preview.mjs' -WorkingDirectory (Get-Location).Path -WindowStyle Hidden -PassThru; for ($i=0; $i -lt 15; $i++) { Start-Sleep -Milliseconds 350; if ((Ready) -or $p.HasExited) { break } } }; if (-not (Ready)) { throw 'Install Node.js 22.13 or newer and check whether port 4317 is in use.' }; Start-Process ($url+'/#/home')"
if errorlevel 1 pause
popd
endlocal
