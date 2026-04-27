# Integration Matrix — Wer spricht mit wem?

Diese Matrix zeigt alle Kommunikationswege zwischen Agenten. Use this to understand dependencies and communication channels.

---

## Struktur: Wer-Spricht-Mit-Wem

```
Direction: → = spricht mit (sendet Task/Request)
           ← = empfängt von (erhält Task/Report)
           ↔ = bidirektional (beide Richtungen)
```

---

## Kommunikations-Hierarchie

```
User Request
   ↓
CEO
   ↓ (delegiert zu)
├─ CTO
│  ├─ Backend Manager
│  │  ├─ API Specialist
│  │  ├─ Database Specialist
│  │  └─ Performance Specialist
│  ├─ Frontend Manager
│  │  ├─ UI Specialist
│  │  ├─ UX Specialist
│  │  └─ Accessibility Specialist
│  ├─ DevOps Manager
│  │  ├─ CI/CD Specialist
│  │  ├─ Cloud Specialist
│  │  └─ Security Specialist
│  ├─ QA Manager
│  │  ├─ Test Engineer
│  │  ├─ Automation Specialist
│  │  └─ Bug Analyst
│  ├─ Systems Architect (direct to CTO)
│  └─ Quality & Compliance Specialist (direct to CTO)
│
├─ Product Manager
│  ├─ Requirement Analyst
│  └─ Documentation Specialist
│
├─ External Dependencies Manager
│  └─ (manages 3rd-party integrations, no direct specialists)
│
├─ Data/AI Manager (optional)
│  ├─ ML Engineer
│  └─ Data Engineer
│
└─ HR Agent (monitors all, escalates from any)
```

---

## Task Assignment & Reporting Flows

### CEO Level

| Receives From | Sends To | What | Notes |
|---|---|---|---|
| User/Nutzer | CTO, Managers | Engineering Tasks | CEO breaks down and routes |
| Managers | User/Nutzer | Aggregated Results | Summary & status |
| CTO | (feedback) | Escalations | Tech decisions needed |
| HR Agent | (feedback) | Agent health alerts | Overload, offline, etc. |

### CTO Level

| Receives From | Sends To | What | Notes |
|---|---|---|---|
| CEO | Managers | Engineering Tasks | Broken down further |
| Managers | CEO | Status Reports, Results | Aggregated per manager |
| Any Manager | Other Managers | Conflict Resolution | Cross-team issues |
| HR Agent | (feedback) | Team health | Performance, overload |

### Manager Level (Backend, Frontend, DevOps, QA)

| Receives From | Sends To | What | Notes |
|---|---|---|---|
| CTO/CEO | Specialists | Subtasks | Broken down to specialist level |
| Specialists | CTO | Status, Results, Escalations | Aggregated from team |
| Other Managers | (coordination) | Dependencies, Context | Cross-team sync |
| HR Agent | (feedback) | Team health | Performance metrics |

**Special Inter-Manager Comms:**
- Backend ↔ Frontend: API Contracts (endpoints, formats)
- Backend ↔ DevOps: Infrastructure needs, deployment requirements
- Frontend ↔ QA: Feature completeness, test readiness
- QA ↔ Any Manager: Test results, quality metrics

### Specialist Level (Terminal / Execution)

| Receives From | Sends To | What | Notes |
|---|---|---|---|
| Manager | (own Manager only) | Status, Results, Blockers | Not to other Specialists directly |
| Other Specialist* | (via Manager) | Coordination info | Manager facilitates |
| HR Agent | (feedback) | Performance metrics | Health, workload |

*Note: Specialists do NOT communicate directly with each other. All communication goes through Manager.

---

## Domain-Specific Integrations

### API Specialist ↔ Database Specialist

**Coordination Points:**
- **Schema Design**: DB Specialist → API Specialist ("Here's the schema")
- **Query Spec**: API Specialist → DB Specialist ("I need this data with this format")
- **Performance**: Both work together on response optimization

**Interface Example:**
```json
{
  "users_table": {
    "schema": {
      "id": "UUID PRIMARY KEY",
      "email": "VARCHAR(255) UNIQUE",
      "password_hash": "VARCHAR(255)"
    },
    "indexes": ["idx_email"],
    "query_example": "SELECT id, email FROM users WHERE email = ?",
    "expected_latency": "<10ms for lookup"
  }
}
```

### Frontend ↔ Backend (API Contract)

**Coordination Points:**
- **API Endpoint Spec**: Backend → Frontend (endpoint, method, request/response format)
- **Error Handling**: Backend → Frontend (error codes, error messages)
- **Authentication**: Backend → Frontend (token format, header name)

**Interface Example:**
```json
{
  "endpoint": "POST /api/auth/login",
  "request": {
    "email": "string",
    "password": "string"
  },
  "response": {
    "200": { "token": "jwt-string", "user_id": "uuid" },
    "401": { "error": "Invalid credentials" },
    "429": { "error": "Too many attempts" }
  },
  "auth_header": "Authorization: Bearer {token}"
}
```

### QA ↔ Backend (Test Requirements)

**Coordination Points:**
- **Test Endpoints**: Backend Specialist provides test endpoints/fixtures
- **Test Data**: Backend provides DB seeds for QA
- **Performance SLAs**: Backend specifies latency requirements, QA tests

### DevOps ↔ Backend (Infrastructure)

**Coordination Points:**
- **Env Vars**: DevOps provides (.env template), Backend uses
- **Secrets**: DevOps manages (API keys, DB passwords), Backend consumes
- **Deployment**: DevOps handles, Backend provides deployment checklist

### Product Manager ↔ All Teams

**Coordination Points:**
- **Requirements**: Product Manager → All Teams
- **Feedback**: User feedback → Product Manager → relevant teams
- **Documentation**: Product Manager synthesizes from all teams

---

## Cross-Manager Coordination (When Tasks Span Multiple Teams)

### Example: "Build User Authentication System"

```
CEO: "Build complete user auth"
  ↓
CTO (breaks down):
  - Backend Manager: "JWT-based auth"
  - Frontend Manager: "Login UI"
  - DevOps Manager: "Rate limiting, monitoring"
  - QA Manager: "E2E auth tests"

They coordinate:
  Backend → Frontend: "Here's the JWT token format, header is 'Authorization: Bearer'"
  Backend → DevOps: "We need env vars: JWT_SECRET, AUTH_TIMEOUT"
  Frontend → QA: "Feature ready for E2E testing"
  QA → Backend: "Auth endpoint needs >99.9% uptime SLA"
  All → CTO: "Status reports daily until done"
```

---

## External Dependencies Manager (Special Case)

**Reports To:** CEO (directly, not CTO)

**Coordinates With:**
- Any Team needing 3rd-party APIs (Backend, DevOps, Data)
- External Services (Stripe, AWS, etc.)
- Legal/Compliance if needed

**Examples:**
- Backend needs Stripe integration → External Deps Manager handles Stripe setup
- DevOps needs AWS account → External Deps Manager coordinates with AWS
- Data Team needs Google Analytics API → External Deps Manager gets credentials

---

## HR Agent (Cross-Cutting)

**Communicates With:** Everyone (monitoring)

**Special Comms:**
- Monitors health heartbeats from all agents daily
- Escalates to CEO if agent is offline or overloaded
- Works with CTO on hiring/new agent creation
- Coaches managers on performance issues

---

## Communication Channels (How They Talk)

| Channel | Used For | Format | Latency |
|---------|----------|--------|---------|
| Task Files (workspace/tasks/) | Main work assignment | JSON | <5 min |
| Result Files (workspace/results/) | Main work delivery | JSON | varies |
| Status Messages | Quick updates | Text | real-time |
| Daily Standups | Sync & blockers | Text/summary | daily |
| Escalations | Critical issues | Direct message + docs | NOW |

---

## Forbidden Communication Patterns

**These DO NOT happen in healthy Agentix system:**

❌ Specialist → Other Specialist (direct task assignment)  
❌ Specialist → CEO (skip Manager)  
❌ Manager → CTO → CEO (Manager should go direct to CTO)  
❌ CEO → Specialist (skip Manager + CTO)  
❌ Parallel task chains without synchronization  

**All communication follows hierarchy. No shortcuts.**

---

## Information Flow: An Example Day

```
Morning:
  CEO receives: "Build payment integration"
  CEO → CTO: "Task: payment integration"
  CTO → Backend Manager: "Subtask: payments API"
  CTO → DevOps Manager: "Subtask: payment rate limiting"
  Backend Manager → API Specialist: "Implement /payment/charge"
  Backend Manager → DB Specialist: "Design payments table"
  
Midday:
  API Specialist: "DB schema ready?"
  Manager: "Just asked DB Spec... here it is"
  API Specialist: "OK, implementing now"
  
Afternoon:
  DB Specialist: "Query optimization: 200ms → 50ms"
  Manager: "Nice! Update API Specialist"
  API Specialist: "Good, response time now <100ms"
  
EOD:
  All Specialists: "Done, results here"
  Backend Manager: "API + DB + Perf done, aggregated result here"
  Backend Manager → CTO: "Backend subtask complete"
  CTO → CEO: "Payment integration complete" (waits for DevOps too)
  CEO → User: "Payment integration ready"
```

---

## Dependency Resolution

**If Task A blocks Task B:**

```
Scenario: Frontend waits on Backend API

Frontend Manager: "API not ready, blocking our UI work"
Manager → CTO: "Blocker: backend API needed by tomorrow"
CTO → Backend Manager: "What's the blocker?"
Backend Manager: "DB schema ready EOD, API available next day"
CTO → Frontend Manager: "API available tomorrow EOD, adjust timeline"
Frontend Manager: "Understood, we'll start QA testing when ready"
```

---

## Matrix Quick Reference

**Manager Reports to:** CTO (except Product Manager → CEO directly)  
**Specialist Reports to:** Their Manager (always!)  
**CTO Reports to:** CEO  
**External Deps Reports to:** CEO  
**HR Reports to:** CEO + Everyone (monitoring)  

**When in doubt:** Follow the hierarchy. No shortcuts.
