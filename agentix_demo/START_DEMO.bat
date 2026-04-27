@echo off
REM Agentix Agent System — Interactive Demo Launcher
REM Windows Batch Script to start the web-based demo

setlocal enabledelayedexpansion

REM Get the directory where this script is located
set DEMO_DIR=%~dp0

REM Check if index.html exists
if not exist "%DEMO_DIR%index.html" (
    echo.
    echo ERROR: index.html not found in %DEMO_DIR%
    echo.
    pause
    exit /b 1
)

REM Open the demo in default browser
echo.
echo ==========================================
echo Agentix Agent System — Interactive Demo
echo ==========================================
echo.
echo Opening demo in your browser...
echo.

start "" "file:///%DEMO_DIR%index.html"

echo Demo opened! You can close this window.
echo.
pause
