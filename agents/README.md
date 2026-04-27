# OpenClaw Agent System

Ein produktionsreifes, hierarchisches Agentur-System für Softwareentwicklung mit vollständiger Orchestrierung, automatischer Delegation und Lifecycle-Management.

---

## 📁 Verzeichnisstruktur

```
agents/
├── ARCHITECTURE.md                    # System design overview
├── ORGANIZATION.md                    # Hierarchie & Rollen-Matrix
├── COMMUNICATION.md                   # Protokolle & Kanäle
├── TASK_SCHEMA.md                     # Task-Datenformat & Lifecycle
├── agent_registry.json                # Alle Agenten (aktiv/inaktiv)
├── skill_registry.json                # Skill-Inventar pro Agent
├── README.md                          # Diese Datei
│
├── ceo/
│   ├── ROLE.md                        # CEO Rollenbeschreibung
│   ├── SKILLS.md                      # Fähigkeiten & Kompetenzen
│   ├── agent.md                       # Execution Guide
│   └── system_prompt.md               # Claude System Prompt
│
├── hr_agent/
│   ├── ROLE.md
│   ├── SKILLS.md
│   └── agent.md
│
├── cto/
│   └── [structure analog]
│
├── backend_manager/
│   └── [structure analog]
│
├── frontend_manager/
│   └── [structure analog]
│
├── devops_manager/
│   └── [structure analog]
│
├── qa_manager/
│   └── [structure analog]
│
├── product_manager/
│   └── [structure analog]
│
├── data_ai_manager/                   # Optional
│   └── [structure analog]
│
├── api_specialist/
│   └── [structure analog]
├── database_specialist/
│   └── [structure analog]
├── performance_specialist/
│   └── [structure analog]
├── ui_specialist/
│   └── [structure analog]
├── ux_specialist/
│   └── [structure analog]
├── accessibility_specialist/
│   └── [structure analog]
├── cicd_specialist/
│   └── [structure analog]
├── cloud_specialist/
│   └── [structure analog]
├── security_specialist/
│   └── [structure analog]
├── test_engineer/
│   └── [structure analog]
├── automation_specialist/
│   └── [structure analog]
├── bug_analyst/
│   └── [structure analog]
├── requirement_analyst/
│   └── [structure analog]
├── documentation_specialist/
│   └── [structure analog]
│
├── _templates/
│   ├── manager_template/              # Template für neue Manager
│   │   └── ROLE.md
│   └── specialist_template/           # Template für neue Spezialisten
│       └── ROLE.md
│
└── workspace/
    ├── tasks/
    │   ├── pending/                   # Neue Tasks (eingegeben)
    │   ├── in_progress/               # Aktive Bearbeitung
    │   └── done/                      # Abgeschlossene Tasks
    │
    ├── results/
    │   ├── ceo/                       # CEO Outputs
    │   ├── managers/                  # Manager Outputs
    │   └── specialists/               # Specialist Outputs
    │
    ├── health/                        # Heartbeat Signals
    │
    ├── logs/
    │   ├── agent_activity.log         # Alle Agent-Aktivitäten
    │   ├── task_lifecycle.log         # Task Status Changes
    │   ├── escalations.log            # Escalation Events
    │   ├── errors.log                 # Fehler & Exceptions
    │   ├── alerts.log                 # Kritische Alerts
    │   └── hr_agent.log               # HR-spezifische Logs
    │
    ├── context.json                   # Aktueller Projekt-Kontext
    ├── metrics.json                   # System Health Metriken
    │
    └── archive/
        └── {YYYY-MM-DD}/              # Tägliche Archivierung
```

---

## 🚀 Quick Start

### 1. System verstehen
Lese diese Dateien in dieser Reihenfolge:
1. **ARCHITECTURE.md** — Überblick & Core Principles
2. **ORGANIZATION.md** — Wer ist wer?
3. **COMMUNICATION.md** — Wie sprechen wir?
4. **TASK_SCHEMA.md** — Was ist eine Task?

### 2. CEO verstehen
- Lese: `ceo/ROLE.md`
- Lese: `ceo/SKILLS.md`
- Lese: `ceo/system_prompt.md`

### 3. CEO starten
- Der CEO Agent wird über OpenClaw TaskFlow aktiviert
- Input: Nutzer-Request
- Output: Decomposed Tasks in `agents/workspace/tasks/pending/`

### 4. Manager & Spezialisten
Jeder Agent hat:
- **ROLE.md** — Was ist meine Verantwortung?
- **SKILLS.md** — Was kann ich?
- **agent.md** — Wie führe ich meine Aufgaben aus?
- **system_prompt.md** — Claude System Prompt

---

## 📊 Hierarchie

```
CEO
├── HR Agent
├── CTO
│   ├── Backend Manager → [API, Database, Performance Specialists]
│   ├── Frontend Manager → [UI, UX, Accessibility Specialists]
│   ├── DevOps Manager → [CI/CD, Cloud, Security Specialists]
│   └── QA Manager → [Test Engineer, Automation, Bug Analyst]
├── Product Manager → [Requirement Analyst, Documentation Specialist]
└── Data/AI Manager → [ML Engineer, Data Engineer] (optional)
```

---

## 💬 Task Flow

```
1. Nutzer → CEO (Request)
2. CEO → Manager (Task Decomposition)
3. Manager → Specialist (Subtask Delegation)
4. Specialist → Manager (Result)
5. Manager → CEO (Report)
6. CEO → Nutzer (Summary)
```

---

## 📝 Eine Task erstellen (als Nutzer)

**Via OpenClaw TaskFlow:**
```
"Build a login page with JWT authentication"
```

CEO erhält die Anfrage und zerlegt sie:

```
1. Backend Task (Backend Manager):
   - Implementiere /api/auth/login Endpoint
   - JWT-Token-Generierung
   - Refresh-Token-Logik

2. Frontend Task (Frontend Manager):
   - Login UI Component
   - Error Handling
   - Token Storage

3. QA Task (QA Manager):
   - End-to-End Testen
   - Security Testing

4. DevOps Task (DevOps Manager):
   - Rate Limiting
   - Monitoring & Alerting
```

---

## 🛠️ Manager werden (Task decomposing)

**Als Manager erhältst du Task vom CEO:**

1. **Lese die Task**: `agents/workspace/tasks/pending/task-{id}.json`
2. **Verstehe**: Kontext, Akzeptanzkriterien, Deadline
3. **Zerlege in Subtasks**: Eine pro Spezialist
4. **Delegiere**: Schreibe Subtasks zu `agents/workspace/tasks/pending/`
5. **Monitore**: Beobachte Spezialist-Progress
6. **Aggregiere Ergebnisse**: Schreibe Report zu `agents/workspace/results/{manager}/`
7. **Berichte dem CEO**: Task ist komplett

---

## 💼 Specialist sein (Execution)

**Als Spezialist erhältst du Subtask vom Manager:**

1. **Acknowledge**: "Ich starte diese Task"
2. **Arbeit**: Führe Subtask unabhängig aus
3. **Teste**: Unit Tests, Manual QA
4. **Delivere**: Schreibe Result zu `agents/workspace/results/{specialist}/`
5. **Update Status**: Task auf `done` setzen

**Wenn du Probleme hast:**
- Frag Manager (nicht CEO!)
- Escaliere Blocker sofort
- Arbeite nicht still — kommuniziere proaktiv

---

## 🆕 Neuen Specialist erstellen

HR Agent macht das automatisch bei Skill Gap.

**Manuell (wenn nötig):**

1. Kopiere Template:
   ```bash
   cp -r _templates/specialist_template agents/new_specialist_name/
   ```

2. Customize:
   - `ROLE.md` — Deine Verantwortung
   - `SKILLS.md` — Deine Fähigkeiten
   - `agent.md` — Deine Execution-Anleitung
   - `system_prompt.md` — Claude Prompt

3. Register in `agent_registry.json`:
   ```json
   {
     "new_specialist_name": {
       "agent_name": "new_specialist_name",
       "agent_id": "agent-new-spec-001",
       "reports_to": "relevant_manager",
       "skills": ["skill1", "skill2"],
       "status": "active"
     }
   }
   ```

4. Update `skill_registry.json` mit neuen Skills

---

## 📊 Monitoring & Health

**HR Agent monitored kontinuierlich:**

1. **Heartbeats**: Jeder Agent sendet signal alle 5 Minuten zu `agents/workspace/health/`
2. **Performance**: Task-Success-Rates, completion times, error counts
3. **Workload**: Wer ist overloaded? Wer ist idle?
4. **Alerts**: Offline-Agenten, High-Error-Rates, Systemic Issues

**Check Health:**
```bash
cat agents/workspace/logs/health.jsonl | tail -20
```

---

## 🚨 Fehlerbehandlung

| Fehler | Escalation Path |
|--------|-----------------|
| Specialist can't complete | Specialist → Manager → CEO |
| Manager unresponsive | CEO → HR Agent |
| Skill Gap | CEO → HR Agent |
| Circular Dependency | CEO (reject & re-decompose) |
| System Overload | CEO (defer low-priority) |

---

## 📈 Metriken

**Tracked in `agents/workspace/metrics.json`:**
- Tasks completed (per day)
- Success rate (overall & per agent)
- Average completion time
- Escalation rate
- System health score (1-100)

---

## 🔄 Task Lifecycle

```
pending
  ↓ (CEO wrote, Manager reads)
assigned
  ↓ (Manager starts decomposition)
in_progress
  ↓ (Manager delegates, Specialists work)
  ├─ done (success!)
  ├─ failed (unrecoverable error)
  ├─ blocked (waiting for dependency)
  └─ escalated (needs higher authority)
```

---

## 💾 Data Persistence

**Alle Tasks:**
- Written to: `agents/workspace/tasks/{status}/task-{id}.json`
- Archived daily to: `agents/workspace/archive/{YYYY-MM-DD}/`
- Logged in: `agents/workspace/logs/task_lifecycle.jsonl`

**Atomic Writes:**
- All file operations use write→rename pattern
- No corruption on partial writes
- Last-write-wins on conflicts (logged)

---

## 🧠 System Prompt (für Claude)

Jeder Agent hat eine `system_prompt.md` mit:
- Core rules (was mache ich, was nicht)
- Decision trees (wann delegiere/eskaliere ich)
- Example flows (wie sehen erfolgreiche Tasks aus)
- Error handling (was wenn etwas schiefgeht)

---

## 📚 Beste Praktiken

### Für CEO:
✅ Delegiere strikt — keine direkte Ausführung
✅ Schreib klare, unambiguous Tasks
✅ Monitore proaktiv auf Blockaden
✅ Eskaliere frühzeitig wenn nötig

### Für Manager:
✅ Zerlege in parallele, unabhängige Subtasks
✅ Kommuniziere Dependencies klar
✅ Monitore Specialist-Progress
✅ Aggregiere Ergebnisse kohärent

### Für Specialist:
✅ Führe Task unabhängig aus
✅ Frag Manager bei Unklarheiten (nicht CEO)
✅ Escaliere Blocker sofort
✅ Liefere Quality-Output ab

---

## 🔧 Wartung

**Täglich:**
- Health Checks (HR Agent)
- Archive old tasks (automatisch)
- Monitor error rates

**Wöchentlich:**
- Performance Review
- Workload Analysis
- Skill Inventory Check

**Monatlich:**
- System Audit
- Agent Evaluation
- Strategic Review

---

## 📞 Support

**Probleme oder Fragen?**

1. **Technical Issues**: Schau in `agents/workspace/logs/errors.log`
2. **Agent Not Responding**: HR Agent wird das detecten
3. **Skill Gap**: CEO escaliert zu HR Agent
4. **System Overload**: CEO deferrt Tasks oder CEO wird benachrichtigt

---

## 🎯 Ziel dieses Systems

✅ **Hierarchische Orchestrierung** — CEO delegiert alles
✅ **Klare Ownership** — Jede Task hat Owner
✅ **Autonomie** — Agenten sind independent, escalieren wenn nötig
✅ **Skalierbarkeit** — Neue Agenten können dynamisch hinzugefügt werden
✅ **Transparenz** — Alles ist geloggt und nachverfolgbar
✅ **Erweiterbarkeit** — Template-System für schnelle Agent-Erstellung

---

## 📖 Weitere Dokumentation

- **ARCHITECTURE.md** — System Design
- **ORGANIZATION.md** — Rollen & Hierarchie
- **COMMUNICATION.md** — Message Protocols
- **TASK_SCHEMA.md** — Data Structures
- **ceo/system_prompt.md** — CEO Anleitung
- **{agent}/ROLE.md** — Agent-spezifische Dokumentation

---

**Version**: 1.0 | **Stand**: 2026-04-23 | **Status**: Production-Ready
