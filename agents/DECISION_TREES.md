# Decision Trees — Wann tue ich was?

Dieses Dokument enthält konkrete Entscheidungsbäume für verschiedene Situationen im Agentix-System.

---

## CEO: "Ich empfange einen User-Request"

```
Request empfangen?
│
├─ Ist es klar und spezifisch?
│  ├─ JA → Zerlege in Manager-Tasks (siehe unten)
│  └─ NEIN → Frag Nutzer um Klarstellung
│     └─ Nutzer antwortet? Zerlege
│
├─ Kennen wir einen Manager dafür?
│  ├─ JA (z.B. "build login page" → Backend Manager)
│  │  └─ Schreib Task zu agents/workspace/tasks/pending/
│  │
│  ├─ NEIN (z.B. "integrate with unknown 3rd-party")
│  │  ├─ Ist es externe Integration? → External Dependencies Manager
│  │  ├─ Ist es Multi-Team? → Assigniere zu mehreren Managern
│  │  └─ Ist es völlig neu? → Eskaliere zu HR Agent
│  │     └─ "Brauchst du einen neuen Agenten?"
│  │
│  └─ UNSICHER → Fragd CTO um Routing
│
└─ Task geschrieben?
   ├─ JA → Monitore Status täglich
   └─ NEIN → Fehler! Logge & debugge
```

---

## Manager: "Ich empfange eine Task vom CEO"

```
Task empfangen?
│
├─ Schritt 1: Verstehen
│  ├─ Kann ich die Acceptance Criteria abklären?
│  │  ├─ JA → Gehe zu Schritt 2
│  │  └─ NEIN → Frag CEO um Klarstellung
│  │
│  ├─ Erkenne ich alle Anforderungen?
│  │  ├─ JA → Gehe zu Schritt 2
│  │  └─ NEIN → Frag CEO oder relevanten Spezialist
│  │
│  └─ Habe ich genug Context (deadline, priorität, constraints)?
│     ├─ JA → Gehe zu Schritt 2
│     └─ NEIN → Frag CEO
│
├─ Schritt 2: Zerlegen
│  ├─ Welche Aspekte sind betroffen?
│  │  (z.B. Backend Task → API? DB? Perf?)
│  │
│  ├─ Kann ich diese parallel zerlegen?
│  │  ├─ JA → Erstelle unabhängige Subtasks
│  │  └─ NEIN → Identifiziere Dependencies
│  │
│  └─ Welcher Spezialist macht was?
│     └─ Nutze INTEGRATION_MATRIX.md
│
├─ Schritt 3: Delegieren
│  ├─ Schreib klare Subtasks (JSON zu agents/workspace/tasks/pending/)
│  ├─ Jede Subtask hat:
│  │  - Acceptance Criteria
│  │  - Deadline
│  │  - Dependencies (wenn relevant)
│  │  - Integration Points (schema, interfaces, etc.)
│  │
│  └─ Sag Spezialisten Bescheid
│
├─ Schritt 4: Monitoren (täglich)
│  ├─ Ist Spezialist auf Track?
│  │  ├─ JA → Keine Action
│  │  └─ NEIN → Frag warum, hilfst du?
│  │
│  ├─ Gibt es Blocker?
│  │  ├─ JA → Hilf unblock oder eskaliere zu CTO
│  │  └─ NEIN → Weitermachen
│  │
│  └─ Sind alle Spezialisten synchron?
│     ├─ JA → Keine Action
│     └─ NEIN → Koordiniere (z.B. "API Specialist, DB-Schema ready? Wenn ja, API kann starten")
│
└─ Schritt 5: Zusammenfassen
   ├─ Alle Subtasks done?
   │  ├─ JA → Integriere Ergebnisse
   │  └─ NEIN → Warten auf offene Aufgaben
   │
   ├─ Akzeptanzkriterien erfüllt?
   │  ├─ JA → Schreib Result zu agents/workspace/results/{manager}/
   │  └─ NEIN → Zurück zu Spezialist: "Bitte nacharbeiten"
   │
   └─ Berichte dem CEO
```

---

## Specialist: "Ich empfange eine Subtask"

```
Subtask empfangen?
│
├─ Schritt 1: Acknowledge
│  └─ Sag Manager: "Ich habe das verstanden, starte jetzt"
│     (nicht still anfangen)
│
├─ Schritt 2: Feasibility-Check
│  ├─ Kann ich das mit meinen Skills machen?
│  │  ├─ JA → Gehe zu Schritt 3
│  │  └─ NEIN → Sag Manager sofort
│  │     └─ "Ich brauche [Spezialität], die habe ich nicht"
│  │
│  ├─ Habe ich alle Abhängigkeiten?
│  │  ├─ JA → Gehe zu Schritt 3
│  │  └─ NEIN → Frag Manager: "Wann ist [dependency] ready?"
│  │
│  └─ Ist der Deadline realistisch?
│     ├─ JA → Gehe zu Schritt 3
│     └─ NEIN → Sag Manager: "Das braucht [X] Tage, nicht [Y]"
│
├─ Schritt 3: Ausführung
│  ├─ Arbeite unabhängig (Manager nicht fragen, wenn es klar ist)
│  ├─ Teste währenddessen (nicht am Ende)
│  │  └─ Unit Tests + Manual Testing
│  │
│  ├─ Gibt es Probleme?
│  │  ├─ NEIN → Gehe zu Schritt 4
│  │  └─ JA → Sind sie blockierend?
│  │     ├─ NEIN → Notiere & arbeite weiter
│  │     └─ JA → Sag Manager sofort:
│  │        "Bin blockiert bei [X], brauchst du [Y]?"
│  │
│  └─ Manager = Unblock-Punkt, nicht Frage-Punkt
│
├─ Schritt 4: Quality Check
│  ├─ Sind Akzeptanzkriterien erfüllt?
│  │  ├─ JA → Gehe zu Schritt 5
│  │  └─ NEIN → Nacharbeiten, nicht abgeben
│  │
│  └─ Code Quality OK? (selbst reviewen)
│     ├─ JA → Gehe zu Schritt 5
│     └─ NEIN → Selbst fixen
│
└─ Schritt 5: Deliver
   ├─ Schreib Result zu agents/workspace/results/{specialist}/
   ├─ Berichte Manager: "Task done, Ergebnis hier"
   └─ Bereit für nächste Aufgabe
```

---

## Specialist: "Ich bin blockiert"

```
Blockiert?
│
├─ Was ist die Blockade?
│  ├─ Warte auf andere Specialist-Ergebnis
│  │  └─ Sage Manager: "A warte auf B"
│  │     └─ Manager koordiniert
│  │
│  ├─ Kann nicht lösen mit meinen Skills
│  │  └─ Sage Manager: "Brauche [Spezialität]"
│  │     └─ Manager bringt dich mit relevant Specialist zusammen
│  │
│  ├─ Abhängigkeit ist nicht ready
│  │  └─ Sage Manager: "[X] sollte ready sein, aber nicht"
│  │     └─ Manager folgt up
│  │
│  └─ Anforderung ist unklar
│     └─ Sage Manager: "Acceptance Criteria widersprechen"
│        └─ Manager klärt mit CEO
│
└─ Schritt: "Wartet" vs. "Arbeitet parallel"
   ├─ Kann ich an anderem arbeiten?
   │  ├─ JA → Arbeite parallel, warte nicht still
   │  └─ NEIN → Informiere Manager: "Vollständig blockiert"
```

---

## Specialist: "Ich finde ein Problem im existierenden Code"

```
Problem gefunden (z.B. Bug, Tech Debt, Security)?
│
├─ Ist es auf meinem Task-Pfad?
│  ├─ JA → Fixe es sofort (gehört zu meiner Verantwortung)
│  └─ NEIN → Gehe zu nächste Frage
│
├─ Blockiert es meine aktuelle Task?
│  ├─ JA → Fixe es sofort
│  └─ NEIN → Gehe zu nächste Frage
│
├─ Ist es kritisch (Security, Data Loss)?
│  ├─ JA → Sage Manager sofort, fix it ASAP
│  └─ NEIN → Gehe zu nächste Frage
│
└─ Sonst → Notiere als Backlog-Item für später (nicht jetzt)
   └─ "Gefunden aber nicht dringend" → Manager/CTO entscheidet Priorität
```

---

## Manager: "Ein Specialist ist offline/nicht responsiv"

```
Specialist nicht responsiv (>2h keine Antwort)?
│
├─ Schritt 1: Direkt kontaktieren
│  └─ "Hey, ich brauche Status Update. Brauchst du Help?"
│     ├─ Antwortet → Weiter arbeiten
│     └─ Keine Antwort → Gehe zu Schritt 2
│
├─ Schritt 2: HR Agent kontaktieren
│  └─ "Specialist X ist nicht responsiv, kannst du checken?"
│     └─ HR Agent: "Agent ist offline" oder "ich helfe helfen"
│
├─ Schritt 3: Task Reassignment
│  ├─ Kann Specialist arbeiten aber ist überladet?
│  │  └─ Verteile Work zu anderem Spezialist
│  │
│  ├─ Ist Specialist definitiv offline?
│  │  └─ Übernehm Task oder delegiere zu anderem
│  │
│  └─ Eskaliere zu CTO wenn nötig
│
└─ Dokumentiere was passierte (HR tracking)
```

---

## CTO: "Ein Manager eskaliert"

```
Manager eskaliert?
│
├─ Was ist das Problem?
│  ├─ "Skill Gap" → Arbeite mit HR Agent
│  │  └─ "Brauchst du neuen Specialist?"
│  │
│  ├─ "Zwei Teams widersprechen sich" → Löse Konflikt
│  │  ├─ "API sagt [X], Frontend sagt [Y]"
│  │  └─ Entscheide oder re-negotiate
│  │
│  ├─ "Deadline unrealistisch" → Re-scope oder priorisiere
│  │  └─ "Können wir Scope kürzen oder Deadline verschieben?"
│  │
│  ├─ "Overloaded Team" → Load-Balance
│  │  └─ "Verschieben wir niedrig-Priorität Tasks?"
│  │
│  └─ "Technisches Problem" → Debugging
│     └─ "Brauchen wir [Tech-Lösung]?"
│
└─ Entscheide & informiere Manager
```

---

## HR Agent: "Ein Agent ist unhealthy"

```
Health Check zeigt Problem?
│
├─ Agent is offline
│  ├─ JA → Alert Manager + CEO
│  └─ NEIN → Gehe zu nächste Frage
│
├─ Agent hat hohe Error-Rate (>10%)
│  ├─ JA → Investigate warum
│  │  ├─ Overloaded? → CEO load-balance
│  │  ├─ Skill Gap? → Coaching or new agent
│  │  └─ Bug in Agent-Logic? → Debug
│  │
│  └─ NEIN → OK
│
├─ Agent hat lange Response Times (>5min)
│  ├─ JA → Similar zu hohe Error-Rate
│  └─ NEIN → OK
│
└─ Backlog sehr lang?
   ├─ JA → Alert Manager: "Dein Team ist Bottleneck"
   └─ NEIN → OK
```

---

## When to Escalate (Schnelle Referenz)

| Situation | Escalate To | Why |
|-----------|-------------|-----|
| Skill Gap (Specialist kann nicht) | Manager → CTO → HR | Vielleicht neuer Agent nötig |
| Deadline unrealistisch | Manager → CTO → CEO | Re-prioritization nötig |
| Zwei Teams widersprechen | Manager → CTO | Technical arbitration |
| Agent offline | Manager → HR | Health issue |
| "Kann Task unmöglich lösen" | Specialist → Manager → CTO | Reassess feasibility |
| Security Issue | Specialist → Manager → CTO | Kritisch |

---

## Notizen

- **Nicht eskalieren wenn:** klare Antwort auf diese Decision Trees existiert
- **Eskalieren schnell wenn:** blockiert, unsicher, kritisch
- **Default:** Specialist fragt Manager, Manager fragt CTO, CTO fragt CEO (nicht vice versa)
