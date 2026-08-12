@echo off
setlocal EnableExtensions
cd /d "%~dp0"
call "%~dp0START_WIKI_SAFE.bat"
exit /b %ERRORLEVEL%
