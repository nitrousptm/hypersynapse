@echo off
REM Agentix 3D Advanced Demo Launcher
REM Ultra High-Performance Realtime Visualization

setlocal enabledelayedexpansion

set DEMO_DIR=%~dp0

if not exist "%DEMO_DIR%advanced.html" (
    echo.
    echo ERROR: advanced.html not found!
    echo.
    pause
    exit /b 1
)

echo.
echo ════════════════════════════════════════════════════════════════
echo          🎮 Agentix 3D — Realtime Visualization
echo ════════════════════════════════════════════════════════════════
echo.
echo 🚀 Launching 3D experience...
echo.
echo 💾 GPU-Optimized Rendering (60 FPS)
echo 🌊 Particle Effects & Physics
echo 📊 Realtime Task Flow Animation
echo 🎨 Advanced Glasmorphism UI
echo.

start "" "file:///%DEMO_DIR%advanced.html"

echo ✅ 3D Demo launched!
echo.
echo 🖱️  Controls:
echo    • Drag Mouse = Rotate View
echo    • Scroll = Zoom In/Out
echo    • Click Play = Start Scenario
echo.
pause
