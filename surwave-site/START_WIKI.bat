@echo off
setlocal
cd /d "%~dp0.."
title Surwave Wiki

where py >nul 2>nul
if %errorlevel%==0 (
  py -3 surwave-site\serve_migrated.py
  goto :eof
)

where python >nul 2>nul
if %errorlevel%==0 (
  python surwave-site\serve_migrated.py
  goto :eof
)

echo Python 3 not found.
echo Install Python 3 and run this file again.
pause
