@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Surwave Wiki Editor

if not exist "surwave-site\serve_migrated.py" goto :missing_files
if not exist "surwave-site\serve_editor.py" goto :missing_files
if not exist "surwave-site\editor\index.html" goto :missing_files

set "PYTHON_CMD="

where py >nul 2>nul
if not errorlevel 1 (
  py -3 -c "import sys; raise SystemExit(0 if sys.version_info >= (3,8) else 1)" >nul 2>nul
  if not errorlevel 1 set "PYTHON_CMD=py -3"
)

if not defined PYTHON_CMD (
  where python >nul 2>nul
  if not errorlevel 1 (
    python -c "import sys; raise SystemExit(0 if sys.version_info >= (3,8) else 1)" >nul 2>nul
    if not errorlevel 1 set "PYTHON_CMD=python"
  )
)

if not defined PYTHON_CMD (
  where python3 >nul 2>nul
  if not errorlevel 1 (
    python3 -c "import sys; raise SystemExit(0 if sys.version_info >= (3,8) else 1)" >nul 2>nul
    if not errorlevel 1 set "PYTHON_CMD=python3"
  )
)

if not defined PYTHON_CMD goto :no_python

echo [Surwave Wiki Editor]
echo Python: %PYTHON_CMD%
echo Project: %CD%
echo.
echo Closing stale Surwave Wiki servers...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_Process ^| Where-Object { ($_.Name -match '^python.*\.exe$') -and $_.CommandLine -and (($_.CommandLine -match 'surwave-site[\\/]serve_editor\.py') -or ($_.CommandLine -match 'surwave-site[\\/]serve_migrated\.py')) } ^| ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }" >nul 2>nul
timeout /t 1 /nobreak >nul

echo Starting editor...
echo.
%PYTHON_CMD% surwave-site\serve_editor.py --editor
set "EXIT_CODE=%ERRORLEVEL%"

echo.
echo ============================================================
if "%EXIT_CODE%"=="0" (
  echo Surwave Wiki Editor server stopped.
) else (
  echo Surwave Wiki Editor failed to start.
  echo Exit code: %EXIT_CODE%
  echo Copy the error shown above if you need help.
)
echo ============================================================
echo.
pause
exit /b %EXIT_CODE%

:missing_files
echo.
echo ============================================================
echo Project files are missing.
echo Make sure the ZIP was fully extracted before starting.
echo Required:
echo   surwave-site\serve_migrated.py
echo   surwave-site\serve_editor.py
echo   surwave-site\editor\index.html
echo ============================================================
echo.
pause
exit /b 2

:no_python
echo.
echo ============================================================
echo Python 3.8 or newer was not found.
echo Install Python 3 and enable "Add Python to PATH".
echo Then run START_EDITOR.bat again.
echo ============================================================
echo.
pause
exit /b 1
