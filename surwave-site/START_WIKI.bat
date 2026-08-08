@echo off
setlocal
cd /d "%~dp0"
title Surwave Wiki

echo [Surwave Wiki] Building all pages and copying GitBook assets...
where py >nul 2>nul
if %errorlevel%==0 (
  py -3 build.py
  if errorlevel 1 goto :error
  py -3 serve.py
  goto :eof
)

where python >nul 2>nul
if %errorlevel%==0 (
  python build.py
  if errorlevel 1 goto :error
  python serve.py
  goto :eof
)

echo.
echo Python 3 is required to build and run the local Wiki.
echo Install Python 3 and enable "Add Python to PATH".
pause
exit /b 1

:error
echo.
echo Wiki build failed. See the error above.
pause
exit /b 1
