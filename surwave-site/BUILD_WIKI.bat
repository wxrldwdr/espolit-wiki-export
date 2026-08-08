@echo off
setlocal
cd /d "%~dp0"
title Build Surwave Wiki
where py >nul 2>nul
if %errorlevel%==0 (
  py -3 build.py
) else (
  python build.py
)
if errorlevel 1 (
  echo.
  echo Build failed.
  pause
  exit /b 1
)
echo.
echo Done. Static site: dist\
pause
