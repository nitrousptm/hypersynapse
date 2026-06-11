# kicktipbot 🤖⚽

Automatischer WM 2026 Tipp-Bot für kicktipp.at mit Live-Dashboard

**Warnung**: Dieser Bot automatisiert Tipps bei kicktipp.at. Dies verstößt wahrscheinlich gegen die ToS. Nutzung auf eigenes Risiko!

## Features

- ✅ Automatisches Login bei kicktipp.at
- ✅ Automatische Tipps basierend auf Quoten + Expertenaussagen
- ✅ Intelligente Tipps-Engine mit Gewichtung
- ✅ **Live-Dashboard** (Web UI, LAN-erreichbar)
- ✅ Quoten von Flashscore + ESPN
- ✅ Experten-Scraping von Reddit + Sportschau
- ✅ Tipps-Historie + Stats (SQLite)
- ✅ Logging + Event-Tracking

## Quick Start

### 1. Setup
```bash
pip install -r requirements.txt
cp .env.example .env
# Editiere .env mit deinen Credentials
sudo apt-get install chromium-chromedriver  # Linux
```

### 2. Bot ausführen
```bash
python main.py
```

### 3. Dashboard öffnen
```bash
./start-dashboard.sh
# Dann öffne http://localhost:5000 oder http://<deine-ip>:5000
```

## Architektur

```
├── main.py              # Bot-Orchestration
├── bot.py              # Selenium WebDriver
├── data_fetcher.py     # Quoten + Experten scraper
├── tipps_engine.py     # Intelligente Tipps-Logik
├── database.py         # SQLite für Tipps-Historie
├── dashboard.py        # Flask Web UI
└── templates/          # HTML Templates
    └── index.html      # Dashboard UI
```

## Datenquellen

### Quoten
- **Flashscore**: Real-time 1X2 Quoten (20+ Bookmaker aggregiert)
- **ESPN**: Alternative Quoten-Source

### Experten
- **Reddit** (r/soccer): Community-Predictions + Sentiment-Analyse
- **Sportschau**: Expert-Tipps von Sportjournalisten

## Tipps-Logik

```
Score = (Quoten × 0.6) + (Experten × 0.3) + (Form × 0.1)
Bestes Tipp = argmax(Score)
```

1. **Quoten** (60%): Inverse Quoten-Wahrscheinlichkeit
2. **Expertenkonsens** (30%): Aggregierte Expert-Predictions
3. **Team-Form** (10%): Aktuelle Form/Verletzungen

## Dashboard Features

- 📊 **Stats**: Erfolgsquote, Tipps-Count, Ø Confidence
- 🎯 **Tipps-Liste**: Alle Tipps mit Status (Won/Lost/Pending)
- 📝 **Logs**: Echtzeit-Logging aller Aktionen
- 🔄 **Auto-Refresh**: Alle 30s automatisch aktualisiert

**Zugriff**:
- Lokal: `http://127.0.0.1:5000`
- LAN: `http://<your-ip>:5000`

## Scheduling

### Option A: Cron
```bash
0 11 * * * cd /path/to/kicktipbot && python main.py >> logs/bot.log 2>&1
```

### Option B: Systemd Timer
Erstelle `/etc/systemd/system/kicktipbot.service` + `.timer`

### Option C: Daemon Mode
```bash
nohup python main.py > logs/bot.log 2>&1 &
```

## Database Schema

### tipps
- `id`, `match_id`, `team1`, `team2`, `tip`, `confidence`
- `odds_data`, `expert_data`, `placed_at`, `result`, `won`

### logs
- `id`, `timestamp`, `level`, `message`

### stats
- `id`, `date`, `total_tips`, `correct_tips`, `win_rate`

## Debugging

```bash
# Check Datenbank
sqlite3 kicktipbot.db "SELECT * FROM tipps LIMIT 5;"

# Live Logs
tail -f logs/bot.log

# Dashboard Logs (im Browser)
http://localhost:5000  # Logs sind am unteren Ende
```

## Nächste Verbesserungen

- [ ] Machine Learning für Tipp-Optimierung
- [ ] Push-Notifications bei neuen Tipps
- [ ] Historische Quoten-Vergleiche
- [ ] Multi-Account Support
- [ ] Advanced Analytics + Charts

## Disclaimer

Dieser Bot ist für **Bildungs- und Unterhaltungszwecke**. Der Nutzer trägt volle Verantwortung für:
- Mögliche Account-Sperrungen
- Alle Tipps und finanziellen Folgen
- Einhaltung lokaler Gesetze und ToS

---

**Version**: 1.0  
**Status**: Production-Ready  
**Letzte Änderung**: 11.06.2026
