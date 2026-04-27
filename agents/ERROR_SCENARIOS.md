# Error Scenarios — Was wenn etwas schiefgeht?

Reale Fehler-Szenarien und wie man sie handled.

---

## Scenario 1: "API Specialist und Database Specialist widersprechen sich"

**Situation:**
```
API Specialist: "Ich brauche dass users.email als response zurückkommt"
Database Specialist: "Email ist encrypted, wird nicht direkt returniert"
```

**Was geht falsch:** Sie arbeiten an parallelen Subtasks ohne Koordination

**Lösung:**
```
Step 1: Backend Manager koordiniert sofort
  Manager: "API Spec, DB Spec, wir müssen über schema sprechen"
  
Step 2: Sie einigen sich auf Interface
  API Spec: "OK, ich lese encrypted_email, dann decrypte ich"
  DB Spec: "Passt, hier ist Column-Name: encrypted_email"
  
Step 3: Backend Manager documentiert Interface
  Schreib zu agents/workspace/results/backend_manager/
  "API und DB Interface dokumentiert unter schema/email_handling.json"
  
Step 4: Beide kontinuieren unabhängig
```

**Prevention:** Beim Decomposing muss Manager die Interface clara stellen:
```json
{
  "interface": {
    "api_response": { "email": "string (encrypted value)" },
    "database_column": { "encrypted_email": "VARCHAR(255)" },
    "transformation": "API reads encrypted_email, returns as-is"
  }
}
```

---

## Scenario 2: "Database Migration schlägt fehl"

**Situation:**
```
Database Specialist hat 1M Rows und Migration schlägt fehl nach 15 Minuten:
"Deadlock detected on users table"
```

**Lösung:**
```
Schritt 1: Specialist checkt sofort
  - Ist es recoverable? (rollback möglich?)
  - Was war der Grund? (Locking issue? Query-Fehler? Space?)

Schritt 2: Eskaliere zu Backend Manager
  Specialist: "Migration failed bei [specifics]. 
              Rollback erfolgreich. 
              Braucht einen anderen Ansatz."

Schritt 3: Manager + Specialist re-designen
  Manager: "Können wir batched migration machen?"
  Specialist: "Ja, 100k rows at a time with locking"
  
Schritt 4: Re-implementieren & testen auf Staging
  - Test migration script auf Staging DB mit 1M Rows
  - Zeige dass es <30 min dauert und keine Deadlocks
  - Erst dann zur Production

Schritt 5: Manager notiert in Result
  "Migration redesigned using batched approach, tested, ready for deploy"
```

**Prevention:** 
- Migrations müssen immer auf Staging mit Production-Datenvolumen getestet werden
- Acceptance Criteria: "Test migration with 1M+ rows, <30min total time"

---

## Scenario 3: "Frontend wartet auf API, API wartet auf DB"

**Situation:**
```
Frontend Manager: "UI needs /api/users endpoint ready by EOD"
Backend Manager (CTO): "Can't, DB schema not ready"
CTO: "Wann ist schema ready?" 
Backend Manager: "Morgen? Nächsten Tag?"
Frontend Manager: "Zu spät, ich bin blockiert"
```

**Das ist NICHT OK!** Manager hätte das erkannt.

**Richtige Handling:**

```
Schritt 1: Bei Task-Decomposition (schon bei Anfang)
  Backend Manager prüft: "Das braucht API + DB"
  Manager stellt fest: "DB schema muss VOR API Design sein"
  Manager sagt Database Specialist: "Deadline EOD heute"
  Manager sagt API Specialist: "Danach morgen"
  
Schritt 2: Database Specialist working
  Tag 1: "Database schema ready by EOD"
  Manager: "Super! API Specialist, du kannst jetzt starten"
  
Schritt 3: API Specialist starts next day
  Tag 2: "API implementation, fertig by EOD"
  
Schritt 4: Frontend manager warned from START
  "Unsere API Endpoint available day 2, not day 1"
```

**Prevention:** 
Manager MUSS Dependencies verstehen beim Decomposing:
```json
{
  "subtasks": [
    { "task": "DB schema", "deadline": "day1", "dependent_on": [] },
    { "task": "API endpoints", "deadline": "day2", "dependent_on": ["DB schema done"] },
    { "task": "Frontend Integration", "deadline": "day3", "dependent_on": ["API ready"] }
  ]
}
```

---

## Scenario 4: "Code Quality ist schlecht, aber Deadline naht"

**Situation:**
```
Bug Analyst: "Test coverage is 45%, target is >80%"
Backend Manager: "Wir müssen bis morgen deployed sein"
Specialist: "Kann ich skips?"
Manager: "Ok, just get it done"
```

**Das ist ein SCHLECHTE Entscheidung**

**Richtige Handling:**

```
Schritt 1: Backend Manager sagt NEIN
  Manager: "Nein, >80% coverage ist Hard requirement"
  Manager prüft aktuellen Status: "45% ist nicht OK"
  
Schritt 2: Evaluate Optionen
  Option 1: Scope reduzieren (weniger Features → bessere Coverage)
  Option 2: Deadline verschieben (mehr Zeit für Tests)
  Option 3: Mehr Tester dazunehmen (parallel write tests)
  
Schritt 3: Eskaliere zu CTO
  Manager: "Feature ist ready, aber coverage ist 45%. 
           Options sind: scope down, deadline push, or mehr resources"
  CTO: "Wir schieben deadline um 2 Tage, dafür 80% coverage"
  
Schritt 4: Test Engineer dazunehmen
  "Test Engineer, bitte fokus auf unit test coverage
   für diese Features"
   
Schritt 5: Deploy wenn Quality OK
```

**Prevention:**
- Quality Standards sind NOT negotiable
- Lieber Feature reduzieren als Quality reduzieren
- CTO enforces KPIs

---

## Scenario 5: "Specialist ist totally stuck, hat keine Idee"

**Situation:**
```
Performance Specialist: "Query is 5 seconds, soll <100ms sein. 
                        Habe Index hinzugefügt, immer noch 5s.
                        Keine Idee warum."
```

**Lösung:**

```
Schritt 1: Escaliere sofort (nicht 2h silent)
  Specialist: "Escalate to Manager: Query optimization stuck at [metrics]"
  
Schritt 2: Manager diagnosed
  Manager: "Zeig mir Query, Query Plan, Data Volume"
  Manager: "Ist das wirklich DB-Problem oder API Problem?"
  
Schritt 3: Hole richtigen Expert
  Wenn es wirklich kompliziert:
  Manager: "Ich hole Systems Architect zur Consultation"
  Systems Architect: "Ah, du brauchst denormalization + caching"
  
Schritt 4: Re-implement
  Specialist: "OK, ich mach denormalization"
  
Schritt 5: Test + deliver
```

**Prevention:**
- Specialists müssen escalieren wenn sie >1h stuck sind
- Manager is responsible für unblocking, nicht warten
- Systems Architect kann konsultiert werden für komplexe Probleme

---

## Scenario 6: "External API ist down"

**Situation:**
```
API Specialist: "Stripe API ist down, kann webhook nicht testen"
Manager: "Wann ist es up?"
Specialist: "Keine Idee. Gefllt mir nicht."
```

**Lösung:**

```
Schritt 1: Sofort zu External Dependencies Manager
  Specialist: "Stripe API ist down seit [time], 
              ich kann nicht testen"
  
Schritt 2: External Deps Manager escaliert
  "Stripe hat Incident, ETA [X]"
  OR "Stripe ist up, aber Credentials sind wrong"
  OR "Stripe API changed, wir müssen Code updaten"
  
Schritt 3: Parallel Work
  Wenn Stripe down: 
    - Schreib Unit Tests (mock Stripe)
    - Schreib Integration Tests (für wenn Stripe up)
    - Dokumentiere Webhook-Handling
    
  Wenn Stripe ist up aber andere Probleme:
    - External Deps Manager fixes und testet direkt mit Stripe
    
Schritt 4: Back to API Specialist
  "Stripe ist working, hier sind Credentials, teste jetzt"
```

**Prevention:**
- External Dependencies Manager monitored 3rd-party health
- Specialists haben Mocks für externe APIs (testing offline)
- Acceptance Criteria include "tested with mock and real API"

---

## Scenario 7: "Task wurde falsch verstanden"

**Situation:**
```
CEO: "Build email validation"
Backend Specialist (nach 2 Tagen): "OK, fertig!"
CEO: "Äh, das sollte real-time validation sein, nicht batch"
Spezialist: "Oh... ich dachte batch"
```

**Das ist MANAGER-Fehler, nicht Specialist-Fehler!**

**Richtige Handling:**

```
Schritt 1: Manager validates Verständnis SOFORT
  Manager liest CEO-Task: "Email validation"
  Manager fragt sofort:
    - "Real-time oder batch?"
    - "Welche validations? (format, domain, bounce detection?)"
    - "Response time requirement?"
    
  Manager schreibt zu Subtask:
  "Task: Email validation
   Type: Real-time API endpoint
   Validations: format, domain existence, bounce detection
   Response: <100ms
   Acceptance Criteria: [...]"

Schritt 2: Specialist sieht KLARE Requirements
  Specialist: "Ah, real-time. Gut, ich designade das richtig"

Schritt 3: Bei Fertigstellung
  Manager: "Checke gegen Acceptance Criteria"
  "Real-time endpoint? Ja. <100ms? Ja. Bounce detection? Ja."
  → Akzeptiert
```

**Prevention:**
- Manager MUSS Task SOFORT clarify, nicht Specialist
- Acceptance Criteria müssen SPEZIFISCH sein
- Manager validiert mit Specialist vor Start: "Verstanden?"

---

## Scenario 8: "Specialist ist overloaded"

**Situation:**
```
Manager hat 5 Tasks an 1 Specialist gegeben.
Specialist: "Ich kann max. 2 Tasks gleichzeitig"
Manager: "Versuche dein best, deadline ist rigid"
Specialist: "Sry, geht nicht, quality leidet"
```

**Lösung:**

```
Schritt 1: Manager erkennt früh (täglich monitoring)
  Manager: "Specialist, Du hast 5 Tasks. 
           Was ist Priorität? 
           Welche sollen warten?"
  
Schritt 2: Manager priorisiert oder verteilt
  Option 1: Re-prioritize
    "Task A, B ready. Task C, D, E können warten"
    
  Option 2: Verteile zu anderem Specialist
    "UI Specialist, kannst du Task C helfen?
     Kommt ein bisschen in dein Gebiet"
    
  Option 3: Hol mehr Resources
    Zu CTO: "API Specialist ist überloaded. 
            Brauchen wir weiteren API Specialist?"

Schritt 3: Monitor Load
  Manager: "OK, jetzt hat Specialist 2 Tasks, realistische Workload"
```

**Prevention:**
- Manager monitors Workload täglich
- KPI: "Workload between 70-100%, nie >100%"
- Wenn >100%, Manager reagiert sofort

---

## Scenario 9: "Requirements changed mid-Task"

**Situation:**
```
Specialist: "Ich bin 50% fertig mit Feature A"
CEO/Manager: "Äh, ich habe neue Requirements für A, 
             total anders now"
```

**Lösung:**

```
Schritt 1: Manager notiert Änderung
  Manager: "Neue Requirements for Task A.
           Original Specialist: 50% done.
           Was tun?"

Schritt 2: Entscheide
  Option 1: Requirements sind kompatibel mit 50% Work?
    Manager: "Mach weiter mit adjustments"
    
  Option 2: Requirements sind incompatible?
    Manager: "Das erfordert Neustart. 
             Re-scopen wir oder verschieben?"
    Manager zu CEO: "Task A hat neue Requirements.
                    Betrifft Deadline. 
                    Brauchen wir neu zu planen?"
    
  Option 3: "Kann ich Features separieren?"
    Manager: "Task A Teil 1: fertig mit aktuellen Requirements
             Task A Teil 2: neu mit neuen Requirements"

Schritt 3: Implementiere Lösung
  - Kein "Silent pivot"
  - Manager communicates sofort
```

**Prevention:**
- Requirements sollten FEST sein vor Task-Start
- Wenn Requirements ändern: ist eine NEW Task, nicht update
- CEO/Manager müssen Requirements sehr früh clarify

---

## Quick Reference: "Ich bin stuck. Was mache ich?"

| Problem | Immediate Action | Then | Then |
|---------|------------------|------|------|
| Nicht wissen wie starten | Ask Manager | Show design | Start |
| Technical blocker | Try alternatives | Ask Manager | Manager escalates to Systems Architect |
| Dependencies nicht ready | Work on other subtasks | Keep asking Manager | If >1h stuck: escalate |
| Requirements unclear | Ask Manager | Manager clarifies | Restart with clear requirements |
| Out of time | Tell Manager ASAP | Manager prioritizes | Re-scope or deadline push |
| Code quality issue | Fix it | Test thoroughly | Deliver quality |
| External API down | Switch to mocking/staging | Ask External Deps Manager | Continue with mock tests |
| Other Specialist blocking | Ask Manager to unblock | Wait or work parallel | Escalate if >2h |

---

## Error Severity Levels

| Severity | Examples | Action | Timeline |
|----------|----------|--------|----------|
| **CRITICAL** | Security breach, Data loss, Major outage | Escalate to CEO, Stop all work | NOW |
| **HIGH** | Deadline missed, Quality way below target, Can't proceed | Escalate to CTO, All hands | <1h |
| **MEDIUM** | Specialist stuck, Resource needed, Unclear requirements | Escalate to Manager, Unblock ASAP | <2h |
| **LOW** | Minor bug found, Nice-to-have improvement | Backlog, note for later | No timeline |

---

**Guiding Principle:** Problems are not failures. Hidden problems are failures. Escalate early, escalate often.
