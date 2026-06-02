# HYPERSYNAPSE Build Script for Windows (PowerShell)
# Usage: .\build_windows.ps1 [-Build] [-Run] [-Capture <audio_file>]

param(
    [switch]$Build = $true,
    [switch]$Run = $false,
    [string]$Capture = "",
    [switch]$Clean = $false
)

$ErrorActionPreference = "Stop"

Write-Host "=== HYPERSYNAPSE Windows Build ===" -ForegroundColor Cyan

# Clean if requested
if ($Clean) {
    Write-Host "Cleaning build directory..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force build -ErrorAction SilentlyContinue
}

# Configure CMake
if (-not (Test-Path build)) {
    Write-Host "Configuring CMake for Visual Studio 2025..." -ForegroundColor Yellow
    cmake -S . -B build -G "Visual Studio 18 2025" -DCMAKE_BUILD_TYPE=Release
    if ($LASTEXITCODE -ne 0) {
        Write-Host "CMake configuration failed!" -ForegroundColor Red
        exit 1
    }
}

# Build
if ($Build) {
    Write-Host "Building Release configuration..." -ForegroundColor Yellow
    cmake --build build --config Release -j
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Build failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "Build successful!" -ForegroundColor Green
}

# Run
if ($Run) {
    $exe = ".\build\Release\hypersynapse.exe"
    if (-not (Test-Path $exe)) {
        Write-Host "Executable not found at $exe" -ForegroundColor Red
        exit 1
    }

    if ($Capture) {
        Write-Host "Running in capture mode with audio: $Capture" -ForegroundColor Yellow
        & $exe --capture $Capture
    } else {
        Write-Host "Running demo..." -ForegroundColor Yellow
        & $exe
    }
}

Write-Host "=== Done ===" -ForegroundColor Green
