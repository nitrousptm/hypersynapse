# Communication Interfaces — Schnittstellen zwischen den Agenten

Dieses Dokument definiert **klar und exakt**, wie die verschiedenen Manager und Spezialisten miteinander kommunizieren. Das ist kritisch für reibungsloses Arbeiten.

---

## Hierarchie & Kommunikations-Überblick

```
                        CTO (Orchestrator)
                        │
        ┌───────────────┼───────────────┬──────────────┐
        │               │               │              │
   Systems Manager  Client Manager  DevOps Manager  QA Manager
        │               │               │              │
    ┌──┬──┬──┐      ┌──┬──┬──┐      ┌──┬──┬──┐     ┌──┬──┬──┐
    │  │  │  │      │  │  │  │      │  │  │  │     │  │  │  │
   API DB Perf     UI UX A11y      CI Cloud Sec    Test Auto Bug
```

**Kommunikations-Regeln:**
1. ✅ **Vertical Communication**: Manager ↔ Specialist (direkt)
2. ✅ **Horizontal Communication**: Manager ↔ Manager (koordiniert)
3. ❌ **Cross-Team Specialist**: Spezialisten sprechen NICHT direkt miteinander
4. ✅ **Eskalation**: Spezialist → Manager → CTO (Hierarchie)

---

## 1. Systems Manager ↔ Client Manager

Dies ist die **kritischste Schnittstelle** — API-Integration für User Interfaces.

### Communication Pattern

```
Client Manager → Systems Manager
  "Wir brauchen folgende API-Endpoints für Payment Checkout..."

Systems Manager → Client Manager  
  "API ist fertig. Hier ist die Dokumentation + Response-Format..."

Client Manager → Systems Manager
  "Endpoint /api/checkout gibt falsches Datenformat zurück!"
  
Systems Manager → Systems Manager (intern)
  "API Specialist, fix das Response-Format"
  
Systems Manager → Client Manager
  "API ist gefixt. Teste nochmal."
```

### Protocol

**1. API Requirements (vom Client Manager)**

```json
{
  "from": "client_manager",
  "to": "systems_manager",
  "type": "api_requirement",
  "date": "2026-04-24",
  
  "endpoints_needed": [
    {
      "method": "POST",
      "path": "/api/checkout",
      "purpose": "Create payment order",
      "request_body": {
        "cart_items": "array of {id: string, qty: int}",
        "shipping_address": "object {street, city, zip, country}",
        "payment_method": "enum: credit_card|paypal|stripe"
      },
      "response_body": {
        "checkout_id": "string (UUID)",
        "status": "enum: pending|processing|completed|failed",
        "redirect_url": "string (for 3D Secure redirect)"
      },
      "error_cases": [
        {"status": 400, "message": "Invalid cart items"},
        {"status": 402, "message": "Payment declined"},
        {"status": 404, "message": "User not found"}
      ],
      "latency_requirement": "<100ms p99"
    },
    {
      "method": "GET",
      "path": "/api/checkout/{checkout_id}",
      "purpose": "Get checkout status",
      "response_body": {
        "checkout_id": "string",
        "status": "enum",
        "order_id": "string (after completed)"
      }
    }
  ],
  
  "timeline": {
    "needed_by": "2026-04-28",
    "ui_ready_before": "2026-04-26 (for mocking)"
  }
}
```

**2. API Contract (vom Systems Manager)**

```json
{
  "from": "systems_manager",
  "to": "client_manager",
  "type": "api_contract",
  "date": "2026-04-25",
  
  "api_version": "v1",
  "base_url": "https://api.example.com/api/v1",
  
  "endpoints": [
    {
      "name": "Create Checkout",
      "method": "POST",
      "path": "/checkout",
      "full_url": "POST https://api.example.com/api/v1/checkout",
      
      "request": {
        "content_type": "application/json",
        "schema": {
          "cart_items": {
            "type": "array",
            "items": {
              "id": {"type": "string", "example": "prod_123"},
              "quantity": {"type": "integer", "example": 2}
            }
          },
          "shipping_address": {
            "street": "string",
            "city": "string",
            "zip": "string",
            "country": "string (ISO-3166)"
          },
          "payment_method": {
            "type": "enum",
            "values": ["credit_card", "paypal", "stripe"]
          }
        }
      },
      
      "response": {
        "status": 200,
        "content_type": "application/json",
        "schema": {
          "checkout_id": {"type": "string", "example": "chk_xyz123"},
          "status": {"type": "enum", "values": ["pending", "processing", "completed", "failed"]},
          "redirect_url": {"type": "string", "nullable": true}
        }
      },
      
      "error_handling": [
        {
          "status": 400,
          "error_code": "INVALID_REQUEST",
          "message": "Invalid cart items or missing fields",
          "response": {"error": "string"}
        },
        {
          "status": 402,
          "error_code": "PAYMENT_FAILED",
          "message": "Payment processor declined transaction",
          "response": {"error": "string", "retry_after": "integer (seconds)"}
        }
      ],
      
      "performance": {
        "target_latency_p99": "100ms",
        "target_throughput": "1000 requests/sec"
      }
    }
  ],
  
  "status": "implemented",
  "ready_for_testing": "2026-04-28",
  "testing_url": "https://api-staging.example.com/api/v1"
}
```

**3. Integration Report (nachdem APIs live gehen)**

```json
{
  "from": "client_manager",
  "to": "systems_manager",
  "type": "integration_report",
  "date": "2026-04-29",
  
  "status": "issues_found",
  "endpoints_tested": [
    {
      "endpoint": "POST /api/checkout",
      "status": "working",
      "notes": "Response format matches contract"
    },
    {
      "endpoint": "GET /api/checkout/{id}",
      "status": "broken",
      "error": "Returns 500 Internal Server Error",
      "request": {"id": "chk_xyz"},
      "response": {"status": 500, "message": "Internal Server Error"}
    }
  ],
  
  "action_needed": "API Specialist needs to fix GET /checkout/{id} endpoint"
}
```

### Response Times

- **API Requirements → Systems Manager**: < 2 hours (Manager Intake)
- **Systems Manager → API Contract**: < 24 hours (Initial Design)
- **Implementation Completion**: Depends on complexity (3-5 days typical)
- **Integration Testing**: < 8 hours (once live)

---

## 2. Systems Manager ↔ Systems Manager Specialists

Interne Koordination innerhalb des Systems Manager Teams.

### Communication Pattern

```
Task Intake:
  Systems Manager → API Specialist + DB Specialist + Performance Specialist
    "Hier ist die Task. Jeder von euch bekommt eine Subtask."

Day-to-Day:
  Systems Manager ← API Specialist: Daily Status
  Systems Manager ← Database Specialist: Daily Status
  Systems Manager ← Performance Specialist: Daily Status

Coordination:
  Systems Manager: "API Specialist, brauchst du etwas von DB Specialist?"
  Systems Manager: "DB Specialist, API Specialist changed response format. Anpassungen nötig?"

Results:
  API Specialist → Systems Manager: "Subtask fertig, hier ist der Code/Report"
  DB Specialist → Systems Manager: "Subtask fertig, hier ist das Schema"
  Performance Specialist → Systems Manager: "Subtask fertig, hier sind die Benchmarks"
  
  Systems Manager → CTO: "Alle 3 Spezialisten fertig. Integration OK. Report ready."
```

### Status Report Format

**Täglich (vor 11 Uhr):**

```json
{
  "from": "api_specialist",
  "to": "systems_manager",
  "type": "daily_status",
  "date": "2026-04-24",
  
  "task_id": "task-001",
  "subtask_id": "subtask-001-api",
  
  "status": "in_progress",
  "percent_done": 60,
  
  "what_done": [
    "Stripe charge endpoint implemented",
    "Unit tests written (85% coverage)",
    "Error handling for declined cards"
  ],
  
  "what_next": [
    "Webhook handler for charge.completed",
    "Integration testing with DB Specialist",
    "API documentation"
  ],
  
  "blockers": [],
  
  "needs_from_others": {
    "from": "database_specialist",
    "what": "Payment transaction table schema",
    "when_needed": "today EOD (for integration testing)"
  },
  
  "notes": "Everything on track. No surprises."
}
```

---

## 3. Client Manager ↔ Client Manager Specialists

Interne Koordination innerhalb des Client Manager Teams.

### Communication Pattern

```
Task Intake:
  Client Manager → UX Specialist + UI Specialist + Accessibility Specialist
    "Hier ist die Feature Task. UX fängt an, UI + A11y warten auf UX."

UX Phase:
  UX Specialist → Client Manager: "Wireframes done. Ready for UI."
  
UI Phase:
  UI Specialist ← Client Manager: "UX wireframes sind ready. Fang an!"
  UI Specialist → Client Manager: "Components 70% done. Should be ready tomorrow."

Accessibility Phase:
  A11y Specialist ← Client Manager: "UI Components ready. Start audit."
  A11y Specialist → Client Manager: "Found contrast issues in dark mode. UI Specialist needs to fix."
  Client Manager → UI Specialist: "A11y found issues, here's the list"
  UI Specialist → Client Manager: "Issues fixed. Re-test?"

Results:
  All → Client Manager: Results/Approval
  Client Manager → CTO: "Feature ready. All components + UX + A11y done."
```

### Status Report Format

```json
{
  "from": "ui_specialist",
  "to": "client_manager",
  "type": "daily_status",
  "date": "2026-04-24",
  
  "task_id": "task-001",
  "subtask_id": "subtask-002-ui",
  
  "status": "in_progress",
  "percent_done": 50,
  
  "components_done": [
    "CartReview (100%)",
    "ShippingForm (80%)",
    "PaymentForm (40%)"
  ],
  
  "blockers": [],
  
  "needs_from_others": {
    "from": "systems_manager",
    "what": "API endpoint for /checkout",
    "status": "mocking for now, need real endpoint by tomorrow"
  },
  
  "ready_for_accessibility_review": false,
  "a11y_review_ready": "2026-04-25"
}
```

---

## 4. Systems Manager ↔ Client Manager (During Development)

Laufende Koordination für API/Frontend Integration.

### API Mocking (während API entwickelt wird)

```json
{
  "from": "client_manager",
  "to": "systems_manager",
  "type": "api_readiness_check",
  "date": "2026-04-25",
  
  "question": "Is /api/checkout endpoint ready?",
  "ui_status": "Components 70% done, need API for integration testing",
  "timeline": "Need API by tomorrow EOD for real integration testing"
}
```

**Response von Systems Manager:**

```json
{
  "from": "systems_manager",
  "type": "api_readiness_response",
  
  "status": "in_progress",
  "eta": "2026-04-26 17:00",
  "recommendation": "Keep mocking for now. Real API will be ready tomorrow evening."
}
```

---

## 5. CTO Orchestration Pattern

Der CTO delegiert Tasks zu den Managern. Manager berichten zurück.

### Input: Task → CTO → Managers

```json
{
  "from": "user",
  "to": "cto",
  "type": "project_request",
  "content": "Implementiere Dark Mode + Payment Integration"
}

// CTO parses und delegiert:

{
  "from": "cto",
  "to": "client_manager",
  "type": "task",
  "title": "Implementiere Dark Mode",
  "details": "..."
}

{
  "from": "cto",
  "to": "systems_manager",
  "type": "task",
  "title": "Stripe Payment Integration",
  "details": "..."
}
```

### Output: Results → Managers → CTO

```json
{
  "from": "client_manager",
  "to": "cto",
  "type": "completion_report",
  "task_id": "task-001",
  
  "status": "completed",
  "what_delivered": [
    "Dark Mode feature implemented",
    "WCAG AA compliant",
    "All 3 components (UX + UI + A11y) done"
  ],
  
  "quality_metrics": {
    "test_coverage": "85%",
    "lighthouse_score": "92",
    "a11y_score": "100"
  }
}

{
  "from": "systems_manager",
  "to": "cto",
  "type": "completion_report",
  "task_id": "task-002",
  
  "status": "completed",
  "what_delivered": [
    "Stripe Payment API endpoints",
    "Payment transaction database",
    "Performance optimized (<100ms)"
  ],
  
  "api_documentation": "...",
  "test_results": "All tests passing"
}
```

---

## 6. Error Handling & Escalation Path

### Wenn Specialist blockt:

```
Specialist: "Ich kann nicht weitermachen, brauche Input von jemand anderem"
  ↓
Manager: "Was brauchst du genau? Von wem? Wann?"
  ↓
Manager → Other Manager: "Kann dein Team uns Input geben?"
  ↓
Falls Ja: "Problem gelöst"
Falls Nein: 
  ↓
Manager → CTO: "Wir sind blocked, CTO-Action nötig"
  ↓
CTO: "Re-prioritization oder Resource-Shift nötig"
```

### Wenn Code Quality Problem:

```
QA Manager: "Diese UI Tests schlagen fehl"
  ↓
Client Manager: "Welche Tests? Wo ist das Problem?"
  ↓
Client Manager → UI Specialist: "Hier sind die QA-Findings. Bitte fixt."
  ↓
UI Specialist: "Gibt mir noch einen Tag"
  ↓
QA Manager: "Re-test... OK, Issue gelöst"
```

---

## 7. File Structure für Inter-Manager Communication

```
agents/workspace/
├── tasks/
│   ├── pending/
│   │   ├── task-001-systems.json (Systems Manager Task)
│   │   ├── task-002-client.json  (Client Manager Task)
│   │   └── task-003-systems.json
│   ├── in_progress/
│   └── done/
│
├── results/
│   ├── systems_manager/
│   │   ├── task-001.json (Completion Report)
│   │   ├── daily-standup-2026-04-24.json
│   │   └── api_contracts/
│   │       └── checkout_api_contract.json
│   │
│   ├── client_manager/
│   │   ├── task-002.json (Completion Report)
│   │   ├── daily-standup-2026-04-24.json
│   │   └── api_requirements/
│   │       └── checkout_requirements.json
│   │
│   ├── api_specialist/
│   ├── database_specialist/
│   ├── ui_specialist/
│   ├── ux_specialist/
│   └── ...
│
├── coordination/
│   ├── systems_vs_client/
│   │   └── payment_integration_status.json
│   ├── standup_logs/
│   │   └── 2026-04-24-standup.json
│   └── escalations/
│       └── blocked_on_api.json
│
└── registry/
    └── agent_registry.json
```

---

## 8. Communication Frequency & Timing

| Communication | Frequency | Time | Owner |
|---------------|-----------|------|-------|
| Daily Standup | 1x/day | 10:00 UTC | Each Specialist |
| Manager Sync | 2x/week | Tuesday + Friday 14:00 UTC | Manager ↔ Manager |
| CTO Review | 1x/week | Monday 09:00 UTC | CTO |
| API Requirements | As needed | < 2h after request | Client Manager |
| API Contract | As needed | < 24h after requirements | Systems Manager |
| Integration Report | After implementation | Same day as API live | Client Manager |
| Escalation | Immediate | ASAP | Manager → CTO |

---

## 9. Summary: Das Wichtigste

**Schnittstellen, die funktionieren müssen:**

1. **Systems Manager ↔ Client Manager**
   - Klare API-Requirements (JSON)
   - API-Contracts
   - Integration Reports

2. **Systems Manager ↔ Systems Manager Specs**
   - Täglich Status Reports
   - Koordination (API ↔ DB ↔ Perf)
   - Clear Subtasks

3. **Client Manager ↔ Client Manager Specs**
   - Täglich Status Reports
   - UX → UI → A11y Flow
   - Clear Dependencies

4. **CTO ↔ Managers**
   - Task Input (JSON)
   - Completion Reports
   - Escalations

**Golden Rules:**
- ✅ Alles schriftlich (JSON/Markdown)
- ✅ Tägliche Status-Berichte
- ✅ Frühe Eskalation
- ✅ Klare Abhängigkeiten
- ✅ Regelmäßige Koordinations-Calls
