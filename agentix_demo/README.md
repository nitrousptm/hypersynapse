# Agentix Agent System — Interactive Demo

Eine vollständig interaktive Demonstration des Agentix hierarchischen Agent-Orchestrierungssystems.

## 🚀 Schnellstart

### Windows (Einfachst)
1. Doppelklick auf `START_DEMO.bat`
2. Demo öffnet sich im Browser
3. Fertig! 🎉

### Windows / Mac / Linux (Mit Python)
```bash
python server.py
```

Dann öffnet sich automatisch die Demo im Browser unter `http://localhost:8000`

## 📋 Was Macht die Demo?

### Visualisierung
- **Agent Hierarchie**: Sieht alle Agenten in der richtigen Struktur
  - 👑 Orchestrators (CEO, CTO, HR)
  - 🎯 Managers (Backend, Frontend, DevOps, QA)
  - 🔧 Specialists (API, Database, Performance, UI, UX, Testing, ...)

### Szenario-Simulator
- **"Build Payment API"**: Ein reales Szenario durchspielen
  - User Request → CEO (decompose) → CTO → Managers → Specialists
  - Sieht wie Tasks durch die Hierarchie fließen
  - Animiert mit Timing

### Task Flow Log
- Real-time log der Task-Progression
- Zeigt jeden Übergabe zwischen Agenten
- Status: pending → assigned → progress → done

### Statistiken
- Tasks processed (wie viele Tasks wurden durchgearbeitet)
- Elapsed Time (wie lange hat das Szenario gedauert)
- Status (Ready / Running / Complete)

## 🎯 Szenario: Payment API

Das Demo-Szenario zeigt wie Agentix eine komplexe Anfrage abarbeitet:

**User Request:** "Implementiere Stripe Payment Integration mit Datenbank und Testing"

**Task Flow:**
```
1. User → CEO
   📋 Task: Empfange & zerlege Request

2. CEO → CTO
   📋 Task: Engineering Task Delegation

3. CTO → Backend Manager
   📋 Task: Backend Implementation

4. Backend Manager → Database Specialist
   📋 Task: Design payments table schema
   
5. Backend Manager → API Specialist
   📋 Task: Implementiere Payment Endpoints
   
6. Backend Manager → Performance Specialist
   📋 Task: Optimiere Queries & Endpoints

7. CTO → QA Manager
   📋 Task: E2E Testing

8. QA Manager → Test Engineer
   📋 Task: Schreib E2E Tests

9. Backend Manager → CTO
   📋 Task: Backend complete, report results

10. QA Manager → CTO
    📋 Task: Testing complete, QA report

11. CTO → CEO
    📋 Task: Payment feature ready for deployment
```

## 🖱️ Wie Man Die Demo Nutzt

1. **▶ Run Scenario** Button klicken
2. Schaue dem Szenario zu wie es sich entfaltet
3. Task Log zeigt jeden Schritt
4. Statistiken aktualisieren sich in Echtzeit
5. **⏹ Stop** Button zum Stoppen (optional)
6. **▶ Run Scenario** zum Wiederholen

## 📁 Dateien

```
agentix_demo/
├── index.html          ← Die Demo (öffne im Browser)
├── server.py           ← Python Server (optional)
├── START_DEMO.bat      ← Windows Launcher (Doppelklick!)
└── README.md           ← Diese Datei
```

## 💻 System-Anforderungen

- **Windows**: Batch-Script + Browser (alles vorhanden)
- **Python**: Falls `server.py` benutzen (3.6+)

## 🎨 Farben & Legende

| Farbe | Agent-Typ | Beispiele |
|-------|-----------|----------|
| 🔴 Rot | Orchestrator | CEO, CTO, HR Agent |
| 🟢 Türkis | Manager | Backend Manager, Frontend Manager, ... |
| 💙 Hellblau | Specialist | API Specialist, DB Specialist, ... |

## 🔗 Zugehörige Dokumentation

Siehe auch:
- `AGENT_SYSTEM.md` — System Überblick
- `DECISION_TREES.md` — Entscheidungslogik
- `ERROR_SCENARIOS.md` — Fehlerbehandlung
- `INTEGRATION_MATRIX.md` — Kommunikationswege
- `MIGRATION_TO_V2.md` — System Migrationsplan

## 💡 Tipps

- **Mehrmals ausführen**: Führe das Szenario mehrmals aus um es zu verstehen
- **Agent Hierarchy studieren**: Klick auf die Agenten um ihre Hierarchie zu sehen
- **Logging lesen**: Das Task Flow Log zeigt genau was jeder Agent macht

## 🐛 Probleme?

**Demo öffnet nicht im Browser?**
- Probiere `server.py` stattdessen: `python server.py`
- Oder öffne `index.html` direkt im Browser

**Batch-Script funktioniert nicht?**
- Stelle sicher `index.html` im gleichen Verzeichnis ist
- Oder nutze `server.py` stattdessen

**Langsam?**
- Das ist normal (Animationen sind absichtlich langsam um Follow-Along zu ermöglichen)

## 📝 Version

- **Version:** 1.0
- **Datum:** 2026-04-27
- **System:** Agentix Agent System v2.0

---

**Viel Spaß mit der Demo! 🚀**
