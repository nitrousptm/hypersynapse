@echo off
REM ============================================================================
REM AGENTIX - Assembly 2026 Demo
REM Build Script (Windows MSVC)
REM ============================================================================

setlocal enabledelayedexpansion

echo.
echo ════════════════════════════════════════════════════════════════════════════
echo                    AGENTIX - Assembly 2026 Demo Build
echo ════════════════════════════════════════════════════════════════════════════
echo.

REM Check if MSVC is available
where cl.exe >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ ERROR: Microsoft Visual C++ compiler not found!
    echo.
    echo Please install Visual Studio Community Edition with C++ development tools:
    echo https://visualstudio.microsoft.com/downloads/
    echo.
    pause
    exit /b 1
)

echo ✅ MSVC detected
echo.

REM Compilation flags
set "COMPILER=cl"
set "FLAGS=/O2 /EHsc /W3 /std:c++17"
set "LIBS=opengl32.lib gdi32.lib user32.lib"
set "OUTPUT=agentix_demo.exe"

echo 🔨 Compiling agentix_demo.cpp...
echo    Compiler: MSVC
echo    Flags: %FLAGS%
echo    Libraries: %LIBS%
echo.

%COMPILER% %FLAGS% agentix_demo.cpp /link %LIBS% /OUT:%OUTPUT%

if %errorlevel% neq 0 (
    echo.
    echo ❌ Compilation failed!
    pause
    exit /b 1
)

echo.
echo ✅ Compilation successful!
echo.
echo 📦 Output: %OUTPUT%
echo 📊 Build Info:
for /f "usebackq" %%A in (`dir /b "%OUTPUT%"`) do (
    for /f "usebackq" %%B in (`powershell -Command "[math]::Round((Get-Item '%OUTPUT%').Length/1KB, 2)"`) do (
        echo    Size: %%B KB
    )
)
echo.

REM Try to run
echo 🚀 Launching demo...
echo.
echo Controls:
echo   SPACE - Start/Stop scenario
echo   ESC   - Exit
echo   Mouse - Look around (not implemented yet)
echo.

start %OUTPUT%

pause
