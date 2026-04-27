# Agentix Agent System — Überblick

**Version:** 2.0 | **Status:** Production | **Datum:** 2026-04-27

---

## Was ist dieses System?

Ein **hierarchisches, ereignisgesteuerte Agentur-Orchestrierungssystem** für verteilte Softwareentwicklung:

- **CEO** (Top) empfängt Request vom Nutzer
- **CEO** zerlegt in **Manager-Tasks**
- **Manager** zerlegt in **Specialist-Subtasks**
- **Specialists** führen aus und berichten zurück

**Kern-Prinzipien:**
- ✅ **Strikte Delegation** — niemand macht nebenbei andere Arbeiten
- ✅ **Autonomie mit Eskalation** — Spezialisten entscheiden selbst, eskalieren früh wenn blockiert
- ✅ **Klare Ownership** — jede Task hat einen Owner
- ✅ **Transparente Fehlerbehandlung** — nicht "escalate", sondern "hier sind konkrete Szenarien"

---

## 3 Agent-Ebenen

### 1. **Orchestratoren** (3 Agenten)
- **CEO** — nimmt User-Request, zerlegt Top-Level
- **CTO** — nimmt Engineering-Tasks, verwaltet Tech-Strategie
- **HR Agent** — monitort Agent-Health, erstellt neue Agenten bei Skill-Gaps

### 2. **Manager** (6-7 Agenten)
- **Backend Manager** — koordiniert API, Database, Performance Specialists
- **Frontend Manager** — koordiniert UI, UX, Accessibility Specialists  
- **DevOps Manager** — koordiniert CI/CD, Cloud, Security Specialists
- **QA Manager** — koordiniert Test, Automation, Bug-Analyst
- **Product Manager** — koordiniert Anforderungen, Dokumentation
- **Data/AI Manager** — koordiniert ML Engineers, Data Engineers (optional)
- **External Dependencies Manager** — verwaltet 3rd-party APIs, integrations

### 3. **Spezialisten** (14+ Agenten)
- API Specialist, Database Specialist, Performance Specialist (unter Backend)
- UI Specialist, UX Specialist, Accessibility Specialist (unter Frontend)
- CI/CD Specialist, Cloud Specialist, Security Specialist (unter DevOps)
- Test Engineer, Automation Specialist, Bug Analyst (unter QA)
- Systems Architect, Quality & Compliance Specialist (unter CTO direkt)
- Requirement Analyst, Documentation Specialist (unter Product)
- ML Engineer, Data Engineer (unter Data/AI, optional)

---

## Task-Lifecycle

```
1. USER REQUEST
   ↓
2. CEO (empfängt)
   ├─ Validiert Request
   ├─ Zerlegt in Manager-Tasks
   ├─ Schreibt zu: agents/workspace/tasks/pending/
   └─ Status: "assigned"
   ↓
3. MANAGER (empfängt)
   ├─ Liest Task
   ├─ Versteht Anforderung
   ├─ Zerlegt in Specialist-Subtasks
   ├─ Delegiert
   └─ Status: "in_progress"
   ↓
4. SPECIALIST (empfängt)
   ├─ Acknowledges
   ├─ Prüft Feasibility
   ├─ Arbeitet unabhängig
   ├─ Schreibt Result
   └─ Status: "done" oder "blocked"
   ↓
5. MANAGER (monitored)
   ├─ Sammelt Specialist-Ergebnisse
   ├─ Integriert zu kohärentem Output
   ├─ Schreibt Result
   └─ Status: "done"
   ↓
6. CEO (finalisiert)
   ├─ Sammelt Manager-Outputs
   ├─ Berichtet Nutzer
   └─ Status: "done"
```

---

## **Nicht in diesem Dokument enthalten**

Diese Infos sind in separaten Dateien:

- **DECISION_TREES.md** — "Wenn X passiert, dann tue Y"
- **ERROR_SCENARIOS.md** — Konkrete Fehler + Lösungen
- **INTEGRATION_MATRIX.md** — Wer spricht mit wem
- **AGENT-Profile** — Jeder Agent hat eine kompakte Datei (max 40 Zeilen):
  - `agents/{agent_name}/PROFILE.md` mit Entscheidungsbaum, Fehler-Handling, KPIs

---

## Wichtige Regeln

### Für Manager
✅ **Decompose first** — verstehe Task vollständig vor Zuweisung  
✅ **Parallel work** — gib unabhängige Subtasks an mehrere Spezialisten  
✅ **Clear interfaces** — wenn Subtasks interagieren, dokumentiere Schema  
✅ **Monitor actively** — nicht warten, bis Spezialist meldet sich  
✅ **Escalate early** — blockiert? Zu CTO, nicht ignorieren  

### Für Specialist
✅ **Acknowledge** — sag sofort, dass du die Task verstanden hast  
✅ **Ask early** — Unklarheiten → Manager fragen, nicht raten  
✅ **Deliver quality** — nicht "gut genug", sondern Production-Ready  
✅ **Test yourself** — nicht QA verlassen auf dich  
✅ **Escalate fast** — Blocker? Sag sofort Manager, nicht still arbeiten  

---

## KPIs (wie wir Erfolg messen)

| Metrik | Target | Owner |
|--------|--------|-------|
| Task Completion Rate | >95% | CEO |
| On-Time Rate | >90% | Manager |
| Escalation Rate | <5% | Manager |
| Code Quality (Coverage) | >80% | Specialist |
| Response Time (to blocker) | <2h | Manager |
| Agent Health (uptime) | >99% | HR Agent |

---

## Was ist NICHT in diesem System

- ❌ Ad-hoc Task-Ausführung (alles über CEO/Manager)
- ❌ Direct Agent-to-Agent Zuweisung außer Manager↔Specialist
- ❌ "I'll figure it out" — klare Decomposition required
- ❌ Lange Handlungs-Zyklen — Manager synced täglich

---

## Wie man dieses System nutzt

1. **System verstehen**: Lies **dieses** Dokument
2. **Agent verstehen**: Lies `agents/{agent_name}/PROFILE.md`
3. **Entscheiden treffen**: Nutze `DECISION_TREES.md`
4. **Fehler debuggen**: Schau in `ERROR_SCENARIOS.md`
5. **Integrationspunkt klären**: `INTEGRATION_MATRIX.md`

---

**Nächste Schritte:** Sieh dir das Agent-Profil deines Agenten an.
