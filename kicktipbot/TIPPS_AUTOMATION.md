# KickTipBot Tipps-Automatisierung

## 🎯 Ziel
Täglich (20:00 UTC / 22:00 CEST) werden Tipps für den nächsten Spieltag **vorberechnet** mit:
- ✅ Aktuellen Quoten (The Odds API, OddsPortal, Betano, heuristic)
- ✅ Experten-Predictions (Reddit, Sportschau, Sky, Tipico)
- ✅ Team-Form + Historie
- ✅ Top-3 Alternativen + Confidence-Level
- ✅ Expected Points für jede Vorhersage

## 📋 Automatisierter Workflow

### 1. Daily Tipps Generator (20:00 UTC)
**Datei:** `daily_tipps_generator.py`

```bash
# Läuft täglich um 20:00 UTC
# Generiert: tipps_YYYY-MM-DD.json
python daily_tipps_generator.py
```

**Output:** `tipps_YYYY-MM-DD.json`
```json
{
  "generated": "2026-06-13T20:00:00",
  "matches": [
    {
      "match": "Deutschland vs Argentinien",
      "main_tip": "2:1",
      "confidence": "78%",
      "expected_points": 2.34,
      "top_3_alternatives": [
        {"score": "1:1", "ep": 1.89},
        {"score": "2:0", "ep": 1.76},
        {"score": "1:0", "ep": 1.52}
      ],
      "data_sources": {
        "odds": "the-odds-api",
        "expert": "reddit+sportschau",
        "form": "H:good A:neutral"
      }
    }
  ]
}
```

### 2. Automation Script (Cron)
**Datei:** `cron_tipps.sh`

```bash
#!/bin/bash
# Läuft täglich um 20:00 UTC (über cron)
cd /home/openclaw/.openclaw/workspace/kicktipbot
python3 daily_tipps_generator.py >> logs/daily_tipps.log 2>&1
```

**Cron-Entry:**
```bash
# Every day at 20:00 UTC
0 20 * * * /home/openclaw/.openclaw/workspace/kicktipbot/cron_tipps.sh
```

### 3. Bot-Submission (Flexibel)
**Datei:** `main.py run_tipps_round`

Wenn Sie Tipps **JETZT** abgeben möchten:
```bash
python3 main.py
```

Der Bot wird:
1. Sich einloggen
2. `tipps_YYYY-MM-DD.json` laden (oder live generieren)
3. Tipps eintragen
4. Absenden

## 🔄 Datenquellen

### Quoten (Priorität)
1. **The Odds API** (best quality, 500/month free)
2. **OddsPortal** (web scraping)
3. **Betano** (web scraping)
4. **Heuristic** (FIFA Rankings fallback)

### Experten
1. **Reddit** (r/soccer Match Threads)
2. **Sportschau** (ARD Expert Tipps)
3. **Sky Sport** (Expert Predictions)
4. **Tipico** (Bookmaker-Tipps)

### Team-Form
1. **OpenLigaDB** (letzte 5 Spiele)
2. **Football-Data.org** (detaillierte Statistiken)

## 🎲 Expected Points Calculation

```
Tipp-Punkte (Kicktipp-Standard):
- Exaktes Ergebnis:   4 Punkte
- Tor-Differenz:      3 Punkte
- Tendenz (1/X/2):    2 Punkte
```

**Expected Points** = Σ(Punkte × Wahrscheinlichkeit)

Beispiel: 2:1 gegen Deutschland
```
P(2:1 exact)     = 12% → 4 pts × 0.12 = 0.48
P(2:1 diff)      = 8%  → 3 pts × 0.08 = 0.24
P(tendency home) = 75% → 2 pts × 0.75 = 1.50
─────────────────────────────────────────
Expected Points = 2.22
```

## 📊 Dashboard Integration

Nach jeder Generierung:
```
✓ Generated 8 tips for 2026-06-14
High Confidence (>60%): 5
Low Risk (EP > 2.0): 6

Next submission: 2026-06-14 12:00 UTC (when betting closes)
```

## 🔧 Konfiguration

**`config.py`** (Required):
```python
ODDS_API_KEY = "your_key_here"  # https://the-odds-api.com
KICKTIPP_EMAIL = "your_email@example.com"
KICKTIPP_PASSWORD = "your_password"
KICKTIPP_GROUP_URL = "https://www.kicktipp.de/gruppeid/..."
```

## 📝 Logging

Alle Operationen werden geloggt zu:
- `logs/daily_tipps.log` — Tägliche Generierungen
- `logs/submission.log` — Bot-Abgaben
- `database` (SQLite) — Historische Tipps + Quoten

## 🚀 Quick Start

```bash
# 1. Test-Generierung (jetzt)
python daily_tipps_generator.py

# 2. Test-Submission
python main.py

# 3. Setup Cron (optional)
crontab -e
# Add: 0 20 * * * /home/openclaw/.openclaw/workspace/kicktipbot/cron_tipps.sh
```

## 📈 Tracking

Nach jeder Generierung wird gespeichert:
- Generierte Tipps
- Gewählte Quoten/Experten
- Expected Points
- Tatsächliche Ergebnisse (später)

→ Ermöglicht Analyse: "Welche Quellen waren am zuverlässigsten?"

---

**Version:** 2.0 (2026-06-13)
**Status:** Production Ready ✓
