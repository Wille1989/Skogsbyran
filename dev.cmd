@echo off
setlocal

set "ROOT=%~dp0"
set "PHP_EXE=C:\Users\WLund\AppData\Local\Microsoft\WinGet\Packages\PHP.PHP.8.4_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe"

if not exist "%PHP_EXE%" (
  echo PHP hittades inte pa den forvantade sokvagen:
  echo %PHP_EXE%
  exit /b 1
)

if not exist "%ROOT%backend\artisan" (
  echo Laravel-backenden hittades inte i backend.
  exit /b 1
)

if not exist "%ROOT%frontend\package.json" (
  echo Frontend hittades inte i frontend.
  exit /b 1
)

start "Skogsbyran Backend" powershell -NoExit -Command "Set-Location '%ROOT%backend'; & '%PHP_EXE%' artisan serve --host=127.0.0.1 --port=8020"
start "Skogsbyran Frontend" powershell -NoExit -Command "Set-Location '%ROOT%frontend'; npm.cmd run dev"

echo Backend and Frontend is now running!

endlocal
