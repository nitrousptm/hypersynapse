# Validate WebM output against Assembly submission requirements
# Usage: .\validate_webm.ps1 hypersynapse.webm

param(
    [string]$WebMFile = "hypersynapse.webm",
    [switch]$Verbose = $false
)

$ErrorActionPreference = "Stop"

Write-Host "=== HYPERSYNAPSE WebM Validation ===" -ForegroundColor Cyan

if (-not (Test-Path $WebMFile)) {
    Write-Host "Error: File not found: $WebMFile" -ForegroundColor Red
    exit 1
}

# Check if ffprobe is available
$ffprobe = (Get-Command ffprobe -ErrorAction SilentlyContinue)
if (-not $ffprobe) {
    Write-Host "Error: ffprobe not found. Install ffmpeg." -ForegroundColor Red
    Write-Host "  Windows: choco install ffmpeg" -ForegroundColor Yellow
    exit 1
}

Write-Host "Analyzing: $WebMFile" -ForegroundColor Yellow

# Get file size
$fileInfo = Get-Item $WebMFile
$fileSizeMB = [math]::Round($fileInfo.Length / 1MB, 2)
Write-Host "File size: $fileSizeMB MB"

# Parse ffprobe output
$ffprobeOutput = & ffprobe -v error -show_format -show_streams $WebMFile 2>&1

# Extract key properties using regex
$duration = if ($ffprobeOutput -match 'duration=([0-9.]+)') { [float]$matches[1] } else { $null }
$videoCodec = if ($ffprobeOutput -match 'codec_name=vp9') { "vp9" } else { "unknown" }
$width = if ($ffprobeOutput -match 'width=(\d+)') { [int]$matches[1] } else { $null }
$height = if ($ffprobeOutput -match 'height=(\d+)') { [int]$matches[1] } else { $null }
$fps = if ($ffprobeOutput -match 'r_frame_rate=(\d+)/(\d+)') { [int]$matches[1] / [int]$matches[2] } else { $null }
$bitRate = if ($ffprobeOutput -match 'bit_rate=(\d+)') { [int]$matches[1] } else { $null }

# Parse using better method (JSON output)
try {
    $json = & ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height,r_frame_rate,bit_rate -show_entries format=duration -of json $WebMFile 2>&1 | ConvertFrom-Json

    if ($json -and $json.streams -and $json.streams[0]) {
        $stream = $json.streams[0]
        $duration = [float]$json.format.duration
        $videoCodec = $stream.codec_name
        $width = $stream.width
        $height = $stream.height
        $fps = $stream.r_frame_rate
        $bitRate = $stream.bit_rate
    }
} catch {
    Write-Host "Warning: Could not parse JSON, using regex fallback" -ForegroundColor Yellow
}

# Display specifications
Write-Host "`n=== Video Specifications ===" -ForegroundColor Green

# Duration check
$durationStatus = "❌"
if ($duration) {
    $durationSeconds = [math]::Round($duration, 1)
    $durationStatus = if ($durationSeconds -ge 226.0 -and $durationSeconds -le 229.0) { "✅" } else { "❌" }
    Write-Host "Duration:     $durationStatus $durationSeconds seconds (target: 227.6 ± 1s)"
    if ($durationStatus -eq "❌") {
        Write-Host "  ERROR: Duration outside tolerance!" -ForegroundColor Red
    }
}

# Resolution check
$resolutionStatus = if ($width -eq 1920 -and $height -eq 1080) { "✅" } else { "❌" }
Write-Host "Resolution:   $resolutionStatus ${width}x${height} (target: 1920x1080)"

# Codec check
$codecStatus = if ($videoCodec -eq "vp9") { "✅" } else { "❌" }
Write-Host "Codec:        $codecStatus $videoCodec (target: vp9)"

# FPS check (handle "60/1" format)
$fpsValue = $null
if ($fps -is [string]) {
    $parts = $fps.Split('/')
    if ($parts.Length -eq 2) {
        $fpsValue = [float]$parts[0] / [float]$parts[1]
    }
} else {
    $fpsValue = [float]$fps
}

$fpsStatus = if ($fpsValue -and [math]::Abs($fpsValue - 60.0) -lt 0.1) { "✅" } else { "❌" }
Write-Host "Frame rate:   $fpsStatus $fpsValue fps (target: 60.0)"

# Bitrate
if ($bitRate) {
    $bitRateMbps = [math]::Round([int]$bitRate / 1000000, 1)
    Write-Host "Bitrate:      $bitRateMbps Mbps (target: ~10 Mbps)"
}

# File size check
$fileSizeStatus = if ($fileSizeMB -le 500) { "✅" } else { "❌" }
Write-Host "File size:    $fileSizeStatus $fileSizeMB MB (limit: ≤ 500 MB)"

# Summary
Write-Host "`n=== Validation Summary ===" -ForegroundColor Green

$allPassed = ($durationStatus -eq "✅") -and ($resolutionStatus -eq "✅") -and ($codecStatus -eq "✅") -and ($fpsStatus -eq "✅") -and ($fileSizeStatus -eq "✅")

if ($allPassed) {
    Write-Host "✅ All checks PASSED — Ready for Assembly submission!" -ForegroundColor Green
} else {
    Write-Host "❌ Some checks FAILED — See errors above" -ForegroundColor Red
    Write-Host "`nCommon issues:" -ForegroundColor Yellow
    if ($durationStatus -eq "❌") {
        Write-Host "  - Duration issue: Check music.wav is exactly 480 seconds"
    }
    if ($fpsStatus -eq "❌") {
        Write-Host "  - FPS issue: Ensure capture was at 60 fps and framerate 60 in ffmpeg"
    }
    if ($fileSizeStatus -eq "❌") {
        Write-Host "  - File too large: Reduce bitrate from 10 Mbps to 8 Mbps"
    }
    exit 1
}

# Additional info
Write-Host "`n=== Detailed Stream Info ===" -ForegroundColor Green
$ffprobeOutput | Select-String "duration|codec|width|height|r_frame_rate|bit_rate" | ForEach-Object {
    Write-Host "  $_"
}

Write-Host "`n=== Ready for Submission ===" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Create hypersynapse.nfo (see SUBMISSION.md)"
Write-Host "  2. Prepare binary (hypersynapse.exe)"
Write-Host "  3. Login to Assembly 2026 portal"
Write-Host "  4. Upload files before 28 July 2026"
