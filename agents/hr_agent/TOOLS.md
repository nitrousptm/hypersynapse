# TOOLS.md — HR Agent / Agent Lifecycle Management
_Deine spezifische Toolbox für Agent-Verwaltung und System-Health_

---

## Primäres Tool: Agent Registry

Die Wahrheit über alle Agenten liegt hier:
- **`agents/agent_registry.json`** — Vollständige Agent-Liste mit Status, Hierarchie, Skills
- **`/home/openclaw/.openclaw/openclaw.json`** — OpenClaw-Konfiguration (wer ist aktiv?)

**Kritische Regel:** Beide Dateien immer konsistent halten.

---

## Agent Onboarding Checklist

Für jeden neuen Agenten:
```
AGENT ONBOARDING CHECKLIST:
Agent ID: [id]
Datum: [ISO8601]

Dateien vorhanden?
  ✓/✗ IDENTITY.md
  ✓/✗ ROLE.md
  ✓/✗ SKILLS.md
  ✓/✗ SOUL.md
  ✓/✗ TOOLS.md
  ✓/✗ BOOTSTRAP.md
  ✓/✗ AGENTS.md
  ✓/✗ USER.md

Registry-Einträge?
  ✓/✗ agents/agent_registry.json (status: "active")
  ✓/✗ openclaw.json (in agents.list)

Funktionaler Check?
  ✓/✗ Agent kann seine Rolle beschreiben?
  ✓/✗ Agent kennt seinen Manager?
  ✓/✗ Agent kennt seine Spezialisten (wenn Manager)?
  ✓/✗ Agent weiß wie er Blockers eskaliert?

ERGEBNIS: ✓ Ready | ✗ Needs attention → [was?]
```

---

## Agent Health Monitor

Regelmäßige Prüfung:
```
AGENT HEALTH CHECK:
Datum: [ISO8601]

VERFÜGBARKEIT:
  Alle aktiven Agenten erreichbar? [Ja/Nein]
  → Nicht erreichbar: [Liste]

PERFORMANCE FLAGS:
  Agenten mit Quality Issues? [Ja/Nein]
  → Issues: [Agent: Problem]

KOMMUNIKATIONS-HEALTH:
  Silent Failures beobachtet? [Ja/Nein]
  → Wo: [Agent: Beschreibung]

ROLLENKONFLIKTE:
  Überlappende Verantwortlichkeiten? [Ja/Nein]
  → Wo: [Beschreibung]

ESKALATIONSNÖTIG:
  → CEO Briefing: [Ja/Nein → was?]
```

---

## Agent Performance Tracker

Wenn ein Agent Performance-Probleme zeigt:
```
PERFORMANCE CASE:
Agent: [ID]
Beobachtung: [Was genau?]
Seit: [Datum]
Auswirkung: [Blockiert es andere? Welche Tasks?]

ANALYSE:
  Rollenambiguität? [Ja/Nein]
  Fehlende Skills/Tools? [Ja/Nein]
  Überlastung? [Ja/Nein]
  Kommunikationsproblem? [Ja/Nein]
  Strukturelles Problem? [Ja/Nein]

MASSNAHMEN:
  Sofort: [Was tue ich jetzt?]
  Kurz: [Was folgt?]
  Eskalation zu CEO: [Ja/Nein → wann?]
```

---

## Agent Offboarding Checklist

Wenn ein Agent deaktiviert wird:
```
AGENT OFFBOARDING:
Agent ID: [id]
Datum: [ISO8601]
Grund: [Warum?]

Knowledge Transfer:
  ✓/✗ Offene Tasks identifiziert?
  ✓/✗ Tasks übergeben an: [Wer?]
  ✓/✗ Kritisches Wissen dokumentiert?

Registry Updates:
  ✓/✗ agent_registry.json: status → "inactive"
  ✓/✗ openclaw.json: aus agents.list entfernt
  ✓/✗ CEO informiert

Verifikation:
  ✓/✗ System läuft ohne diesen Agent?
  ✓/✗ Keine anderen Agenten abhängig?
```

---

## Referenz-Dateien

| Datei | Zweck |
|-------|-------|
| `agents/agent_registry.json` | Master-Liste aller Agenten |
| `agents/ORGANIZATION.md` | Hierarchie & Reporting-Struktur |
| `/home/openclaw/.openclaw/openclaw.json` | OpenClaw-Konfiguration |

---

## Lokale Konfiguration

```yaml
health_check_frequency: täglich
onboarding_checklist: mandatory für jeden neuen Agent
performance_review: wöchentlich
escalation_threshold: "Wenn Problem >24h ungelöst → CEO"
```

---

**Version:** 1.0 | **Company:** Agentix | **Tier:** Executive (Tier 0) | **Created:** 2026-04-27
