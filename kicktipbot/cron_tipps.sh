#!/bin/bash
# Daily Tipps Generator Cron Job
# Runs daily at 20:00 UTC to generate tips for tomorrow

set -e

BASE_DIR="/home/openclaw/.openclaw/workspace/kicktipbot"
LOG_DIR="$BASE_DIR/logs"
VENV="$BASE_DIR/venv"

# Create logs directory if needed
mkdir -p "$LOG_DIR"

# Activate virtual environment
if [ -f "$VENV/bin/activate" ]; then
    source "$VENV/bin/activate"
fi

# Generate daily tips
cd "$BASE_DIR"

echo "=====================================" >> "$LOG_DIR/daily_tipps.log"
echo "[$(date '+%Y-%m-%d %H:%M:%S UTC')] Starting daily tipps generator" >> "$LOG_DIR/daily_tipps.log"
echo "=====================================" >> "$LOG_DIR/daily_tipps.log"

python3 daily_tipps_generator.py >> "$LOG_DIR/daily_tipps.log" 2>&1

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S UTC')] ✓ Daily tipps generated successfully" >> "$LOG_DIR/daily_tipps.log"
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S UTC')] ✗ Daily tipps generation failed (exit code: $EXIT_CODE)" >> "$LOG_DIR/daily_tipps.log"
fi

echo "" >> "$LOG_DIR/daily_tipps.log"

exit $EXIT_CODE
