#!/bin/bash
# Daily Tipps Cron Job — täglich 20:00 UTC
# 1. Generiert Vorschau-JSON für morgen
# 2. Submittiert ALLE offenen Matches an kicktipp.de (heute + morgen + alle zukünftigen)
# 3. Erkennt Quoten-Änderungen (>15%) und aktualisiert Tipps automatisch

BASE_DIR="/home/openclaw/.openclaw/workspace/kicktipbot"
LOG_DIR="$BASE_DIR/logs"

mkdir -p "$LOG_DIR"

cd "$BASE_DIR"

# ── 1. Preview-JSON generieren ──────────────────────────────────────────────
echo "=====================================" >> "$LOG_DIR/daily_tipps.log"
echo "[$(date '+%Y-%m-%d %H:%M:%S UTC')] Starting daily tipps generator" >> "$LOG_DIR/daily_tipps.log"
echo "=====================================" >> "$LOG_DIR/daily_tipps.log"

python3 daily_tipps_generator.py >> "$LOG_DIR/daily_tipps.log" 2>&1
GEN_EXIT=$?

if [ $GEN_EXIT -eq 0 ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S UTC')] ✓ Preview JSON generated" >> "$LOG_DIR/daily_tipps.log"
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S UTC')] ✗ Preview generation failed (exit: $GEN_EXIT)" >> "$LOG_DIR/daily_tipps.log"
fi

echo "" >> "$LOG_DIR/daily_tipps.log"

# ── 2. Tipps an kicktipp.de übertragen (alle offenen Matches) ──────────────
echo "=====================================" >> "$LOG_DIR/submit.log"
echo "[$(date '+%Y-%m-%d %H:%M:%S UTC')] Submitting tips to kicktipp.de" >> "$LOG_DIR/submit.log"
echo "=====================================" >> "$LOG_DIR/submit.log"

python3 main.py >> "$LOG_DIR/submit.log" 2>&1
SUB_EXIT=$?

if [ $SUB_EXIT -eq 0 ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S UTC')] ✓ Tips submitted successfully" >> "$LOG_DIR/submit.log"
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S UTC')] ✗ Submit failed (exit: $SUB_EXIT)" >> "$LOG_DIR/submit.log"
fi

echo "" >> "$LOG_DIR/submit.log"

# Erfolgreich wenn Submit geklappt hat
exit $SUB_EXIT
