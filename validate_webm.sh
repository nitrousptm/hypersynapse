#!/bin/bash
# Validate WebM output against Assembly submission requirements
# Usage: ./validate_webm.sh [hypersynapse.webm]

set -e

WEBM_FILE="${1:-.hypersynapse.webm}"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}=== HYPERSYNAPSE WebM Validation ===${NC}"

# Check if file exists
if [ ! -f "$WEBM_FILE" ]; then
    echo -e "${RED}Error: File not found: $WEBM_FILE${NC}"
    exit 1
fi

# Check if ffprobe is available
if ! command -v ffprobe &> /dev/null; then
    echo -e "${RED}Error: ffprobe not found. Install ffmpeg.${NC}"
    echo -e "${YELLOW}  Linux: sudo apt-get install ffmpeg${NC}"
    echo -e "${YELLOW}  macOS: brew install ffmpeg${NC}"
    exit 1
fi

echo -e "${YELLOW}Analyzing: $WEBM_FILE${NC}"

# Get file size
FILE_SIZE=$(ls -lh "$WEBM_FILE" | awk '{print $5}')
FILE_SIZE_MB=$(du -m "$WEBM_FILE" | awk '{print $1}')
echo "File size: ${FILE_SIZE} (${FILE_SIZE_MB} MB)"

# Get JSON output from ffprobe
FFPROBE_JSON=$(ffprobe -v error -show_format -show_streams -of json "$WEBM_FILE")

# Extract properties using jq or awk/grep
DURATION=$(echo "$FFPROBE_JSON" | grep -o '"duration":"[^"]*"' | cut -d'"' -f4 | head -1 || echo "0")
CODEC=$(echo "$FFPROBE_JSON" | grep -o '"codec_name":"[^"]*"' | head -1 | cut -d'"' -f4)
WIDTH=$(echo "$FFPROBE_JSON" | grep -o '"width":[0-9]*' | cut -d':' -f2 | head -1)
HEIGHT=$(echo "$FFPROBE_JSON" | grep -o '"height":[0-9]*' | cut -d':' -f2 | head -1)
FPS=$(echo "$FFPROBE_JSON" | grep -o '"r_frame_rate":"[^"]*"' | head -1 | cut -d'"' -f4)
BITRATE=$(echo "$FFPROBE_JSON" | grep -o '"bit_rate":"[^"]*"' | head -1 | cut -d'"' -f4)

# Try jq if available for more reliable parsing
if command -v jq &> /dev/null; then
    DURATION=$(echo "$FFPROBE_JSON" | jq -r '.format.duration')
    CODEC=$(echo "$FFPROBE_JSON" | jq -r '.streams[0].codec_name' 2>/dev/null || echo "unknown")
    WIDTH=$(echo "$FFPROBE_JSON" | jq -r '.streams[0].width' 2>/dev/null || echo "0")
    HEIGHT=$(echo "$FFPROBE_JSON" | jq -r '.streams[0].height' 2>/dev/null || echo "0")
    FPS=$(echo "$FFPROBE_JSON" | jq -r '.streams[0].r_frame_rate' 2>/dev/null || echo "0/1")
    BITRATE=$(echo "$FFPROBE_JSON" | jq -r '.streams[0].bit_rate' 2>/dev/null || echo "0")
fi

# Convert values to numbers
DURATION_INT=$(printf "%.0f" "$DURATION" 2>/dev/null || echo "0")
WIDTH_INT=$(printf "%d" "$WIDTH" 2>/dev/null || echo "0")
HEIGHT_INT=$(printf "%d" "$HEIGHT" 2>/dev/null || echo "0")
BITRATE_MBPS=$(echo "scale=1; $BITRATE / 1000000" | bc 2>/dev/null || echo "0")

echo ""
echo -e "${GREEN}=== Video Specifications ===${NC}"

# Duration check (480 ± 0.1 seconds)
if [ "$DURATION_INT" -ge 479 ] && [ "$DURATION_INT" -le 481 ]; then
    DURATION_STATUS="✅"
else
    DURATION_STATUS="❌"
fi
echo -e "Duration:     $DURATION_STATUS ${DURATION_INT} seconds (target: 480.0 ± 0.1)"

# Resolution check
if [ "$WIDTH_INT" -eq 1920 ] && [ "$HEIGHT_INT" -eq 1080 ]; then
    RESOLUTION_STATUS="✅"
else
    RESOLUTION_STATUS="❌"
fi
echo -e "Resolution:   $RESOLUTION_STATUS ${WIDTH_INT}x${HEIGHT_INT} (target: 1920x1080)"

# Codec check
if [ "$CODEC" = "vp9" ]; then
    CODEC_STATUS="✅"
else
    CODEC_STATUS="❌"
fi
echo -e "Codec:        $CODEC_STATUS $CODEC (target: vp9)"

# FPS check (parse "60/1" format)
FPS_VALUE=$(echo "$FPS" | awk -F'/' '{print $1/$2}')
FPS_INT=$(printf "%.0f" "$FPS_VALUE" 2>/dev/null || echo "0")
if [ "$FPS_INT" -eq 60 ]; then
    FPS_STATUS="✅"
else
    FPS_STATUS="❌"
fi
echo -e "Frame rate:   $FPS_STATUS $FPS_INT fps (target: 60)"

# Bitrate check
echo "Bitrate:      $BITRATE_MBPS Mbps (target: ~10 Mbps)"

# File size check
if [ "$FILE_SIZE_MB" -le 500 ]; then
    FILESIZE_STATUS="✅"
else
    FILESIZE_STATUS="❌"
fi
echo -e "File size:    $FILESIZE_STATUS ${FILE_SIZE_MB} MB (limit: ≤ 500 MB)"

# Summary
echo ""
echo -e "${GREEN}=== Validation Summary ===${NC}"

if [ "$DURATION_STATUS" = "✅" ] && [ "$RESOLUTION_STATUS" = "✅" ] && [ "$CODEC_STATUS" = "✅" ] && [ "$FPS_STATUS" = "✅" ] && [ "$FILESIZE_STATUS" = "✅" ]; then
    echo -e "${GREEN}✅ All checks PASSED — Ready for Assembly submission!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some checks FAILED — See errors above${NC}"
    echo ""
    echo -e "${YELLOW}Common issues:${NC}"
    if [ "$DURATION_STATUS" = "❌" ]; then
        echo "  - Duration issue: Check music.wav is exactly 480 seconds"
    fi
    if [ "$FPS_STATUS" = "❌" ]; then
        echo "  - FPS issue: Ensure capture was at 60 fps and framerate 60 in ffmpeg"
    fi
    if [ "$FILESIZE_STATUS" = "❌" ]; then
        echo "  - File too large: Reduce bitrate from 10 Mbps to 8 Mbps"
    fi
    exit 1
fi
