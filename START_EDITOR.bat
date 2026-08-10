@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Surwave Wiki Editor

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

%PYTHON_CMD% surwave-site\serve_migrated.py --editor
set "EXIT_CODE=%ERRORLEVEL%"

if not "%EXIT_CODE%"=="0" (
  echo.
  echo ============================================================
  echo Surwave Wiki Editor failed to start.
  echo Exit code: %EXIT_CODE%
  echo Copy the error shown above if you need help.
  echo ============================================================
  echo.
  pause
)
exit /b %EXIT_CODE%

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
