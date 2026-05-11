#!/usr/bin/env python3
"""HYPERSYNAPSE — daily Telegram status report.

Reads dashboard state from filesystem (no live server required) and sends
a compact German status message to the configured Telegram chat.

Run manually:
    python3 scripts/daily-telegram-status.py

Or via cron (see scripts/install-cron.sh).
"""
from __future__ import annotations

import json
import os
import sys
import urllib.request
from datetime import datetime, timezone, timedelta
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
STATE_DIR = REPO / "dashboard" / "backend" / "state"
OPENCLAW_CONFIG = Path.home() / ".openclaw" / "openclaw.json"

# Vienna timezone (CEST in summer = UTC+2, CET in winter = UTC+1)
VIENNA_OFFSET_HOURS = 2  # crude, refine with zoneinfo if needed


def load_telegram_config() -> tuple[str, str]:
    """Read bot token + chat id from openclaw config."""
    cfg = json.loads(OPENCLAW_CONFIG.read_text())
    tg = cfg.get("channels", {}).get("telegram", {})
    token = tg.get("botToken")
    allow = tg.get("allowFrom") or []
    if not token or not allow:
        raise RuntimeError("Telegram bot token or chat id missing in openclaw.json")
    return token, allow[0]


def read_json(path: Path, default):
    try:
        return json.loads(path.read_text())
    except FileNotFoundError:
        return default
    except json.JSONDecodeError:
        return default


def read_activities(path: Path, limit: int = 20) -> list[dict]:
    if not path.exists():
        return []
    lines = path.read_text().splitlines()
    out = []
    for line in lines[-limit:]:
        line = line.strip()
        if not line:
            continue
        try:
            out.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return out


def fmt_local(iso_str: str | None) -> str:
    if not iso_str:
        return "—"
    try:
        dt = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
        local = dt.astimezone(timezone(timedelta(hours=VIENNA_OFFSET_HOURS)))
        return local.strftime("%H:%M")
    except Exception:
        return iso_str


def filter_today(activities: list[dict]) -> list[dict]:
    """Activities from the last 24h (since yesterday's report)."""
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    out = []
    for a in activities:
        ts = a.get("timestamp")
        if not ts:
            continue
        try:
            dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            if dt >= cutoff:
                out.append(a)
        except Exception:
            continue
    return out


def build_message() -> str:
    state = read_json(STATE_DIR / "state.json", {
        "project": "HYPERSYNAPSE",
        "phase": "?",
        "phaseName": "Unbekannt",
        "phaseProgress": 0,
        "overallProgress": 0,
        "hold": False,
    })
    tokens = read_json(STATE_DIR / "tokens.json", {"total": 0, "byAgent": {}})
    activities = read_activities(STATE_DIR / "activities.jsonl", limit=200)
    last24 = filter_today(activities)

    today = datetime.now(timezone(timedelta(hours=VIENNA_OFFSET_HOURS)))
    weekdays_de = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"]
    date_str = f"{weekdays_de[today.weekday()]}, {today.strftime('%d.%m.%Y')}"

    lines: list[str] = []
    lines.append(f"🧠 *HYPERSYNAPSE — Daily Status*")
    lines.append(f"_{date_str}_")
    lines.append("")

    # Phase
    if state.get("hold"):
        lines.append(f"⏸ *ON HOLD* — {state.get('holdReason') or 'pausiert'}")
    else:
        lines.append(f"▶ *Aktiv* — Phase {state.get('phase')} ({state.get('phaseName')})")
    lines.append(f"📊 Phase: *{state.get('phaseProgress', 0)}%*  •  Gesamt: *{state.get('overallProgress', 0)}%*")
    lines.append("")

    # Was lief in den letzten 24h
    done_today = [a for a in last24 if a.get("status") == "done"]
    in_progress = [a for a in last24 if a.get("status") == "in_progress"]

    lines.append(f"✅ *Erledigt (24h):* {len(done_today)}")
    for a in done_today[-5:]:
        agent = a.get("agent", "?")
        action = a.get("action", "")
        lines.append(f"   • _{agent}_: {action}")

    if in_progress:
        lines.append("")
        lines.append(f"🔄 *In Arbeit:* {len(in_progress)}")
        for a in in_progress[-3:]:
            agent = a.get("agent", "?")
            action = a.get("action", "")
            lines.append(f"   • _{agent}_: {action}")

    # Tokens
    lines.append("")
    total = tokens.get("total", 0)
    lines.append(f"🪙 *Tokens gesamt:* {total:,}".replace(",", "."))
    by_agent = tokens.get("byAgent", {})
    if by_agent:
        top = sorted(by_agent.items(), key=lambda kv: kv[1], reverse=True)[:3]
        for agent, count in top:
            lines.append(f"   • {agent}: {count:,}".replace(",", "."))

    # Footer
    lines.append("")
    lines.append("🌐 Dashboard: http://127.0.0.1:5173")

    return "\n".join(lines)


def send_telegram(token: str, chat_id: str, text: str) -> dict:
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = json.dumps({
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "Markdown",
        "disable_web_page_preview": True,
    }).encode()
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode())


def main() -> int:
    try:
        token, chat_id = load_telegram_config()
    except Exception as exc:
        print(f"config error: {exc}", file=sys.stderr)
        return 2

    msg = build_message()
    if os.environ.get("DRY_RUN"):
        print(msg)
        return 0

    try:
        result = send_telegram(token, chat_id, msg)
        if not result.get("ok"):
            print(f"telegram error: {result}", file=sys.stderr)
            return 1
        print(f"sent message_id={result['result'].get('message_id')}")
        return 0
    except Exception as exc:
        print(f"send failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
