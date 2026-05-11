#!/usr/bin/env bash
# Install / update the daily Telegram status cron job.
# Default: 08:57 Vienna time (= 06:57 UTC during CEST, 07:57 UTC during CET).
#
# Override the time by setting CRON_EXPR env var, e.g.
#   CRON_EXPR="3 7 * * *" ./scripts/install-cron.sh   # 07:03 UTC daily
#
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPT="$REPO/scripts/daily-telegram-status.py"
LOG="$HOME/.cache/hypersynapse-daily-status.log"

# Default: 06:57 UTC = 08:57 Vienna (CEST)
CRON_EXPR="${CRON_EXPR:-57 6 * * *}"
TAG="# hypersynapse-daily-status"

mkdir -p "$(dirname "$LOG")"

# Drop any existing job with our tag, then add the new one.
# `|| true` so missing crontab or "no match" exits don't trip pipefail.
NEW_CRONTAB="$( { crontab -l 2>/dev/null || true; } | grep -v "$TAG" || true )"
NEW_LINE="$CRON_EXPR /usr/bin/python3 $SCRIPT >> $LOG 2>&1 $TAG"
printf '%s\n%s\n' "$NEW_CRONTAB" "$NEW_LINE" | sed '/^$/d' | crontab -

echo "Installed cron: $CRON_EXPR"
echo "Script:         $SCRIPT"
echo "Log:            $LOG"
echo ""
echo "Current crontab:"
crontab -l | grep "$TAG"
