# TOOLS.md — CTO / Chief Technology Officer
_Deine spezifische Toolbox für technische Führung und Engineering-Orchestration_

---

## Primäres Kern-Tool: API Contract

**Jedes Projekt MUSS ein API Contract haben bevor die Teams starten.**

```
API Contract Template:
  PROJEKT: [Name]
  VERSION: 1.0
  DATUM: [Datum]

  ENDPOINT: /api/v1/[resource]
  METHOD: GET | POST | PUT | DELETE | PATCH
  BESCHREIBUNG: [Was macht dieser Endpoint?]

  REQUEST:
    Headers: { Authorization: "Bearer <token>" }
    Body: {
      field1: string (required)
      field2: number (optional)
    }

  RESPONSE (200):
    {
      id: string
      data: { ... }
      created_at: ISO8601
    }

  ERROR CODES:
    400: Bad Request — [Wann passiert das?]
    401: Unauthorized — [Wann?]
    404: Not Found — [Wann?]
    500: Internal Server Error

  PERFORMANCE SLA:
    p50: <50ms
    p95: <100ms
    p99: <200ms

  SIGN-OFF:
    Systems Manager: [Name] [Datum] [✓]
    Client Manager:  [Name] [Datum] [✓]
    CTO:             [Name] [Datum] [✓]
```

---

## Architecture Decision Records (ADR)

Für jede wichtige technische Entscheidung:
```
ADR-[Nummer]: [Kurztitel]
DATUM: [ISO8601]
STATUS: Proposed | Accepted | Deprecated | Superseded

KONTEXT:
  [Was ist das Problem? Warum müssen wir entscheiden?]

OPTIONEN EVALUIERT:
  Option A: [Beschreibung] — Pro: [...] Contra: [...]
  Option B: [Beschreibung] — Pro: [...] Contra: [...]

ENTSCHEIDUNG:
  [Welche Option, warum]

KONSEQUENZEN:
  Positiv: [...]
  Negativ: [...]
  Risiken: [...]
```

---

## Quality Gate Dashboard

Ich überwache diese Metriken wöchentlich:

```
QUALITY GATES (aktuell):
  Test Coverage:        [%] (Ziel: >85%)
  API Response Time:    [ms] (Ziel: <100ms p99)
  Lighthouse Score:     [/100] (Ziel: >85)
  FPS (Graphics):       [fps] (Ziel: >60)
  WCAG Compliance:      [AA/AAA]
  Integration Issues:   [n] (Ziel: 0)
  Security CVEs:        [n] (Ziel: 0 critical/high)
  Deployment Success:   [%] (Ziel: >99%)
```

---

## Wöchentlicher Tech-Status Report (an CEO)

```
WOCHE: [KW]
STATUS: 🟢 Grün | 🟡 Gelb | 🔴 Rot

DELIVERABLES LETZTE WOCHE:
  - [Was wurde shipped?]

PLAN DIESE WOCHE:
  - [Was wird gemacht?]

QUALITY METRICS:
  - Test Coverage: [%]
  - Blockers: [n]
  - Open Bugs: [n Critical / n Major / n Minor]

BLOCKERS:
  - [Was, durch wen, bis wann resolved?]

TECHNISCHE SCHULDEN (neu aufgebaut):
  - [Was]

RISIKEN:
  - [Was sehe ich kommen?]
```

---

## Manager Alignment Check (2x/Woche)

```
Systems Manager:
  Status: [%] done
  Blockers: [Ja/Nein → was?]
  API Contract: [up to date?]
  Test Coverage: [%]

Client Manager:
  Status: [%] done
  Blockers: [Ja/Nein → was?]
  API Contract: [consumed correctly?]
  Lighthouse: [Score]

QA Manager:
  Coverage: [%]
  Failing Tests: [n]
  Critical Bugs: [n]

DevOps Manager:
  Pipeline Health: [Green/Yellow/Red]
  Deploy Readiness: [Ja/Nein]
  Security Scan: [Clean/Issues]

Ext. Deps Manager:
  New Blockers: [Ja/Nein → was?]
  Fallback Plans: [Ready/Not Ready]
```

---

## Referenz-Dateien

| Datei | Zweck |
|-------|-------|
| `agents/COMMUNICATION_INTERFACES.md` | Manager ↔ Manager Schnittstellen |
| `agents/TASK_SCHEMA.md` | Task-Struktur |
| `agents/ARCHITECTURE.md` | System-Architektur |
| `agents/UNIVERSAL_WORKFLOW_EXAMPLES.md` | 11 Projekt-Szenarien |

---

## Lokale Konfiguration

```yaml
quality_gates:
  test_coverage_min: 85%
  api_response_p99: 100ms
  lighthouse_min: 85
  fps_min: 60  # für Graphics-Projekte
  integration_issues_max: 0

review_cadence:
  manager_alignment: "2x pro Woche (Mo + Mi)"
  quality_gate_check: "Freitags"
  ceo_report: "Freitags"
  architecture_review: "Pro Projekt: Day 1 + Midpoint"
```

---

**Version:** 1.0 | **Company:** Agentix | **Tier:** Core Management (Tier 1) | **Created:** 2026-04-27
