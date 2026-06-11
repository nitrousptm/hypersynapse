# kicktipbot 🤖⚽

Automatischer WM 2026 Tipp-Bot für kicktipp.at

**Warnung**: Dieser Bot automatisiert Tipps bei kicktipp.at. Dies verstößt wahrscheinlich gegen die ToS. Nutzung auf eigenes Risiko!

## Features

- ✅ Automatisches Login bei kicktipp.at
- ✅ Automatische Tipps basierend auf Quoten + Expertenaussagen
- ✅ Intelligente Tipps-Engine mit Gewichtung
- ✅ Scheduler für automatische Runden vor Spieltagen

## Setup

### 1. Dependencies installieren
```bash
pip install -r requirements.txt
```

### 2. .env Datei erstellen
```bash
cp .env.example .env
# Dann editieren mit deinen Kicktipp-Login-Daten
```

### 3. ChromeDriver installieren
Der Bot nutzt Selenium mit Chrome. ChromeDriver muss im PATH sein:
```bash
# Ubuntu/Debian
sudo apt-get install chromium-chromedriver

# Oder von hier: https://chromedriver.chromium.org/
```

### 4. Test-Run
```bash
python main.py
```

## Scheduling (Automatische Tipps-Runden)

### Option A: Cron (Linux/Mac)
```bash
# Vor jedem Spieltag um 11 Uhr ausführen
0 11 * * * cd /path/to/kicktipbot && python main.py >> logs/kicktipbot.log 2>&1
```

### Option B: Systemd Timer (Linux)
Erstelle `/etc/systemd/system/kicktipbot.timer` und `.service` Dateien

### Option C: Schedule (OpenClaw)
```
/schedule "0 11 * * *" python main.py
```

## Architektur

- **bot.py**: Selenium WebDriver für Kicktipp-Automation
- **data_fetcher.py**: Holt Quoten + Expertenaussagen von APIs/Websites
- **tipps_engine.py**: Berechnet optimale Tipps
- **main.py**: Orchestriert den gesamten Flow

## Tipps-Logik

1. **Quoten-Analyse** (60%): Inverse Quoten-Wahrscheinlichkeit
2. **Expertenkonsens** (30%): Sammelt Predictions von Experten
3. **Team-Form** (10%): Berücksichtigt aktuelle Form

```
Score = (Quote-Score × 0.6) + (Expert × 0.3) + (Form-Bonus × 0.1)
Bester Tip = argmax(Score)
```

## Nächste Verbesserungen

- [ ] Echte API-Integration für Quoten (z.B. api-football.com)
- [ ] Reddit/Twitter-Scraping für Expertenaussagen
- [ ] Machine Learning für Tipp-Optimierung
- [ ] Detailliertes Logging + Stats Dashboard
- [ ] Fehlerbehandlung + Retry-Logik

## Disclaimer

Dieser Bot ist für **Bildungs- und Unterhaltungszwecke**. Der Nutzer trägt volle Verantwortung für:
- Mögliche Account-Sperrungen bei kicktipp.at
- Alle Tipps und finanziellen Folgen
- Einhaltung lokaler Gesetze und kicktipp.at ToS

---

**Autor**: Xena  
**Status**: Beta  
**Letztes Update**: 11.06.2026
