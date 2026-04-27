# OpenClaw Agent System Architecture

## Überblick

Ein hierarchisches, selbstorganisierendes Agentur-System für Softwareentwicklung. Der CEO orchestriert, Manager koordinieren, Spezialisten führen aus.

**Kernprinzipien:**
- CEO delegiert **strikt** — keine direkten Ausführungen
- Manager zerlegen Tasks in Subtasks (Task Decomposition)
- Spezialisten sind Handler für konkrete Arbeit
- HR-Agent erstellt neue Agenten bei Bedarf
- Alles läuft über TaskFlow und Dateisystem

---

## Hierarchie

```
┌─────────────────────────────────────────────┐
│  CEO (Orchestrator)                         │
│  - Projekt-Ziele → Task-Decomposition       │
│  - Delegation & Monitoring                  │
│  - Eskalation-Handling                      │
└─────────────────────────────────────────────┘
         │
         ├─ HR Agent (Agent Lifecycle)
         ├─ CTO / Engineering Manager
         ├─ Product Manager
         ├─ Data/AI Manager (optional)
         │
         └─ [Manager sprechen nur mit CEO + ihren Spezialisten]
              │
              └─ [Spezialisten führen Tasks aus]
```

---

## Task-Verarbeitung (Flow)

```
1. Nutzer → CEO (Request)
   └─ CEO parsed Request in strategische Tasks

2. CEO → Manager (Task Decomposition)
   └─ Manager zerlegt in konkrete Subtasks

3. Manager → Specialist (Execution)
   └─ Specialist führt aus, reportet Status

4. Specialist → Manager (Result)
   └─ Manager aggregiert Ergebnisse

5. Manager → CEO (Completion Report)
   └─ CEO gibt Summary an Nutzer
```

---

## Datenspeicherung

```
agents/workspace/
├── tasks/                    # Task-Queue (eingehend)
│   ├── pending/             # Neu eingegeben
│   ├── in_progress/         # Aktiv bearbeitet
│   └── done/                # Abgeschlossen
│
├── results/                  # Output & Artefakte
│   ├── ceo/
│   ├── managers/
│   ├── specialists/
│   └── summaries/
│
├── logs/                     # Audit Trail
│   ├── agent_activity.log
│   ├── task_lifecycle.log
│   └── errors.log
│
└── registry/
    ├── agent_registry.json   # Alle Agenten + Status
    └── skill_registry.json   # Skills pro Agent
```

---

## Kommunikationswege

| Von | Zu | Kanal | Format |
|-----|-----|-------|--------|
| Nutzer | CEO | TaskFlow / Dateisystem | JSON Task |
| CEO | Manager | TaskFlow Event | JSON Task |
| Manager | Specialist | File Event / Direct Call | JSON Subtask |
| Specialist | Manager | File Write | JSON Result |
| Manager | CEO | File Write | JSON Report |
| HR Agent | CEO | Direct Event | JSON Agent-Definition |

---

## Fehlerbehandlung & Eskalation

```
Specialist unable to complete
  ↓
Manager reassigns / escalates
  ↓
CEO reviews → either:
  a) Delegates to different Specialist
  b) Triggers HR to create new Specialist
  c) Defers Task
```

---

## Erweiterbarkeit

**Neue Abteilung hinzufügen:**
1. Verzeichnis erstellen: `agents/{manager_name}/`
2. ROLE.md, SKILLS.md, agent.md schreiben
3. CEO → ORGANIZATION.md updaten
4. Agent-Registry updaten

**Neue Skills hinzufügen:**
1. Zu agent.md → `skills:` Section
2. skill_registry.json updaten
3. Fertig.

---

## Status & Monitoring

- **Agent Health**: Letzter Heartbeat, aktive Tasks, Fehlerquote
- **Task Velocity**: Tasks/Stunde pro Manager & Specialist
- **Escalation Rate**: Wie oft Tasks nicht gelöst werden
- **System Load**: Queue-Länge, durchschnittliche Task-Bearbeitungszeit

Alle Metriken landen in `logs/metrics.json`.
