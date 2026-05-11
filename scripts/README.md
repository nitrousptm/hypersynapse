# scripts/

Operational helpers — not part of the demo build.

## `daily-telegram-status.py`

Reads dashboard state files from `dashboard/backend/state/` and posts a daily
German status report to Telegram. Bot token + chat id are read from
`~/.openclaw/openclaw.json` (channels.telegram), so nothing sensitive is
hard-coded here.

```bash
# Preview only (no send)
DRY_RUN=1 python3 scripts/daily-telegram-status.py

# Send now
python3 scripts/daily-telegram-status.py
```

## `install-cron.sh`

Installs / updates the daily cron entry. Default fires at 06:57 UTC,
which is 08:57 in Vienna (CEST). Override with `CRON_EXPR`:

```bash
# Default (08:57 Vienna time during summer)
./scripts/install-cron.sh

# Custom: 21:30 UTC daily
CRON_EXPR="30 21 * * *" ./scripts/install-cron.sh

# Inspect / remove
crontab -l                          # see current
crontab -l | grep -v hypersynapse | crontab -   # remove our job
```

Logs go to `~/.cache/hypersynapse-daily-status.log`.
