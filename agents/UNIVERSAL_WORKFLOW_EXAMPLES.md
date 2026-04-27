# Universal Workflow Examples — Systems Manager & Client Manager in Action

Dieses Dokument zeigt, wie die **Systems Manager** und **Client Manager** Rollen **universell** verschiedene Arten von Softwareentwicklung handhaben können — nicht nur Web-Backend/Frontend, sondern alle Arten.

---

## 1. Web Application (Traditional)

**Request:** "Baue ein Admin Dashboard mit Echtzeit-Daten"

### Workflows

**Systems Manager handles:**
- REST API für Dashboard-Daten
- Datenbankschema für Admin-Daten
- Performance (Echtzeit-Updates via WebSocket)
- Integration mit Authentifizierung

**Client Manager handles:**
- UX für Admin Dashboard (Widgets, Charts, Filters)
- UI Implementation (React/Vue Components)
- Responsive Design (Desktop, Tablet)
- Accessibility (WCAG AA for Admin Tools)

### Timeline

```
Week 1:
  Systems Manager: "Wir brauchen diese API Endpoints..."
  Client Manager: "Wir brauchen diese Daten-Struktur..."
  → Both teams koordinieren API-Contract
  
Week 2:
  Systems Manager Team: Baut API + DB (parallel)
  Client Manager Team: Designs UX, mockt API
  
Week 3:
  Systems Manager: "API ist ready"
  Client Manager: "UI is ready. Integriere echte API"
  → Integration Testing
  
Week 4:
  QA Manager: Tests everything
  DevOps Manager: Deploys to production
```

---

## 2. Mobile App (iOS/Android)

**Request:** "Baue eine Expense Tracking App für iOS + Android"

### Workflows

**Systems Manager handles:**
- REST/GraphQL API für Expense Data
- Datenbankschema (expenses, categories, users)
- Authentifizierung (OAuth/JWT)
- File Upload (für Receipts)
- Performance für mobiles Netzwerk

**Client Manager handles:**
- UX für Mobile (iPhone, Android)
- UI für iOS (Swift UI, native components)
- UI für Android (Kotlin, Material Design)
- oder: Cross-platform (React Native, Flutter)
- Offline-First Sync
- Accessibility (VoiceOver, TalkBack)

### Timeline

```
Week 1:
  Client Manager: "Wir brauchen diese API Endpoints..."
  Systems Manager: "OK, API Specialist macht das"
  → API-Contract zwischen Mobile + Backend

Week 2-3:
  Systems Manager: Baut API + DB
  Client Manager: Designs Mobile UX, baut Components

Week 4:
  Systems Manager: "API ready"
  Client Manager: "App ready. Integriere echte API"
  → Mobile-specific Testing (performance auf slow network, battery)

Week 5:
  QA Manager: Mobile Testing
  DevOps Manager: App Submission (App Store, Play Store)
```

---

## 3. CLI Tool (Command-Line Utility)

**Request:** "Schreib CLI-Tool zum Batch-User-Import aus CSV"

### Workflows

**Systems Manager handles:**
- CLI Argument Parsing (using Python Click, Node Commander, etc.)
- CSV Parser (handle quoted fields, escaping)
- Bulk-Insert Logic
- Validation & Error Handling
- Database Schema Modifications

**Client Manager handles:**
- User Experience (CLI UX):
  - Clear help text (`--help`)
  - Progress bar (showing import progress)
  - Error messages (which row failed, why?)
  - Success confirmation
- Accessibility: Colorblind-friendly output, screen reader friendly
- Interactive prompts (Ask for confirmation before bulk delete)

### Workflow

```
Systems Manager Task:
├─ Subtask 1 → API Specialist: CLI framework (argument parsing, help text)
├─ Subtask 2 → Database Specialist: Bulk-insert optimization
└─ Subtask 3 → Performance Specialist: Load test (10k users/minute)

Client Manager Task:
├─ Subtask 1 → UX Specialist: User flow (how users interact with CLI)
├─ Subtask 2 → UI Specialist: Terminal UI (colors, formatting, progress)
└─ Subtask 3 → A11y Specialist: Colorblind-safe colors, no-color mode

Integration:
  CLI Tool = Backend Logic (Systems) + UX/UI (Client)
  All in one binary!
```

### CLI Example

```bash
$ my-app import-users --file users.csv
Reading file...
Processing: ████████░░ 82/100 rows
Success: 82 rows imported ✓
Failed: 18 rows (see errors.log)
$
```

---

## 4. Data Pipeline (ETL/Batch Processing)

**Request:** "Baue tägliche ETL Pipeline: Ingest → Transform → Warehouse"

### Workflows

**Systems Manager handles:**
- ETL Framework (Apache Airflow, Prefect, dbt)
- Data Source Integration (APIs, Databases, Files)
- Transformation Logic (Data cleaning, aggregation)
- Data Warehouse Schema
- Error Handling & Retry Logic
- Monitoring & Alerting

**Client Manager handles:**
- Monitoring UI (show pipeline status)
- Alert Notifications (send emails, Slack alerts when pipeline fails)
- Dashboard (view data quality metrics)
- Manual Trigger UI (allow manual pipeline runs)

### Workflow

```
Systems Manager: "Build ETL pipeline (Airflow tasks, Python transforms)"
  ↓
Client Manager: "Build monitoring dashboard + alert UI"
  ↓
Integration: When pipeline fails, send alert + show on dashboard
```

---

## 5. Embedded System (Raspberry Pi, Arduino)

**Request:** "Baue Smart Home Controller: Raspberry Pi + Temperature Sensors"

### Workflows

**Systems Manager handles:**
- Embedded Logic (Python/C on Raspberry Pi)
- Sensor Interface (reading temperature, humidity)
- Local Network Communication (MQTT, HTTP)
- Cloud API Integration (send data to cloud)
- Database (SQLite on device)
- Firmware Updates

**Client Manager handles:**
- Physical UI: LED display showing temperature
- Mobile App: Remote control of smart home
- Web Dashboard: Monitor device status
- Accessibility: Voice feedback (speak temperature)

### Workflow

```
Systems Manager:
  └─ API Specialist: Cloud API for Smart Home
  └─ Database Specialist: Device data + history
  └─ Firmware: Embedded device logic

Client Manager:
  └─ UI Specialist: Mobile app UI
  └─ UX Specialist: User flows (turn device on/off, set schedules)
  └─ A11y Specialist: Voice feedback for blind users
```

---

## 6. Data Analytics Platform

**Request:** "Baue Analytics Dashboard: Ingest → Process → Visualize"

### Workflows

**Systems Manager handles:**
- Data Ingestion (APIs, Webhooks, File Uploads)
- Data Processing (Aggregations, ML models)
- Data Storage (Data Warehouse)
- API Endpoints (for dashboard to query data)
- Performance (query optimization for 1M+ rows)

**Client Manager handles:**
- Dashboard UX (what charts, what metrics?)
- UI Charts & Visualizations (React D3, Recharts, Plotly)
- Interactive Filters (drill-down analytics)
- Export (CSV, PDF reports)
- Real-time Updates (WebSocket for live metrics)
- Mobile-responsive Dashboard
- Accessibility (charts must be accessible)

### Workflow

```
Client Manager: "We need these metrics visualized"
  ↓
Systems Manager: "OK, API Specialist exposes these aggregations"
  ↓
Client Manager: "UI renders charts, using API data"
```

---

## 7. Library/Framework (Open Source)

**Request:** "Publish React Data Table Library (open source)"

### Workflows

**Systems Manager handles:**
- Architecture Design (component structure)
- Performance (virtual scrolling, lazy loading)
- API Design (props interface for developers)
- Testing (unit tests for core logic)
- Documentation (API docs for users)

**Client Manager handles:**
- Component UI (visual design of table, styling)
- UX Design (filtering, sorting UX)
- Example Apps (demo apps showing library usage)
- Accessibility (WCAG for data tables)
- Website/Documentation Site UI

### Workflow

```
Systems Manager: "Core table logic, API design, tests"
Client Manager: "Visual design, UX, example apps"
Result: React Data Table Library
```

---

## 8. Integration Service (3rd-party APIs)

**Request:** "Integrate Stripe + Mailchimp + Segment"

### Workflows

**Systems Manager handles:**
- Stripe Integration (payments, webhooks)
- Mailchimp Integration (email lists, campaigns)
- Segment Integration (event tracking)
- Data Synchronization
- Error Handling & Retries
- Monitoring & Logging

**Client Manager handles:**
- Integration Settings UI (allow admins to configure credentials)
- Status Dashboard (show integration health)
- Event Browser (show events sent to integrations)
- Audit Log UI (show all integration activity)

### Workflow

```
Systems Manager: "Implement Stripe/Mailchimp/Segment integrations"
Client Manager: "Build settings page + monitoring dashboard"
```

---

## 9. Real-time Collaboration App (like Google Docs)

**Request:** "Build real-time document collaboration (multiple users editing same doc)"

### Workflows

**Systems Manager handles:**
- WebSocket Server (real-time updates)
- Operational Transformation (OT) or CRDT (conflict resolution)
- Document Storage (database)
- Version History (save snapshots)
- Permissions (who can edit what)
- Authentication

**Client Manager handles:**
- Editor UI (text input, formatting toolbar)
- Cursor Presence (show where other users are typing)
- Comments & Suggestions
- Real-time Sync (visual feedback when others type)
- Mobile Editor
- Accessibility (screen reader support)

### Workflow

```
Systems Manager: "WebSocket server, OT/CRDT sync, database"
Client Manager: "Editor UI, real-time visual feedback, mobile support"
Integration: Editor sends changes → WebSocket → other clients update UI
```

---

## 10. Game

**Request:** "Develop multiplayer browser game"

### Workflows

**Systems Manager handles:**
- Game Server (game state, physics)
- Multiplayer Logic (player sync, matchmaking)
- User Accounts (login, profile)
- Leaderboard API
- Database (user stats, game history)
- WebSocket for real-time updates

**Client Manager handles:**
- Game UI (Canvas/WebGL rendering)
- Menus (start game, settings, profile)
- HUD (heads-up display: score, health, etc.)
- Visual Effects & Animations
- Mobile Touch Controls
- Accessibility (colorblind mode, screen reader for menus)

### Workflow

```
Systems Manager: "Game server, physics, player sync, database"
Client Manager: "Game renderer, menus, HUD, controls, accessibility"
Integration: Client sends input → Server updates state → Broadcast to clients
```

---

## 11. Microservices Architecture

**Request:** "Build order processing system with microservices"

### Workflows

**Services breakdown:**
1. Order Service (create, manage orders)
2. Payment Service (Stripe integration)
3. Shipping Service (calculate shipping, integrate with carriers)
4. Notification Service (emails, SMS)
5. Admin Dashboard (monitor all services)

**How it maps to Systems Manager / Client Manager:**

```
Systems Manager: Handles all 5 services
  ├─ Order Service: API Specialist + Database Specialist
  ├─ Payment Service: API Specialist + 3rd-party Integration
  ├─ Shipping Service: API Specialist + external APIs
  ├─ Notification Service: Email/SMS system
  └─ Data Pipeline: Aggregate service metrics

Client Manager: Handles monitoring & admin interfaces
  ├─ Admin Dashboard: Monitor services (uptime, latency)
  ├─ Service Status Page: Show service health
  ├─ Manual Actions: Retry failed orders, cancel shipments
  └─ Analytics: View trends across services
```

---

## Key Insight: Universal Roles

**What makes these roles UNIVERSAL:**

| Scenario | Systems Manager | Client Manager |
|----------|-----------------|----------------|
| Web App | REST API | React UI |
| Mobile App | REST API | iOS/Android UI |
| CLI Tool | CLI Logic | Terminal UI/UX |
| Data Pipeline | Pipeline Logic | Monitoring Dashboard |
| Embedded System | Firmware | LED Display + Mobile App |
| Analytics Platform | Data Warehouse API | Charts & Visualizations |
| Library | Core Logic | Example Apps & Website |
| Integration Service | 3rd-party APIs | Settings & Status UI |
| Real-time App | WebSocket Server | Editor UI |
| Game | Game Server | Game Renderer |
| Microservices | All Services | Admin Dashboard |

**Pattern:** 
- **Systems Manager** = Backend/Logic/Infrastructure (any system-level concern)
- **Client Manager** = Frontend/UI/UX (any user-facing interface)

---

## Summary

Die **Systems Manager** und **Client Manager** Rollen sind **nicht begrenzt auf "Web Backend" und "Web Frontend"**. Sie sind universell:

- **Systems Manager** koordiniert alle **server-seitigen, system-nahen** Entwicklung (APIs, Datenbanken, Integrations, Services, Firmware, Logik)
- **Client Manager** koordiniert alle **client-seitigen, benutzerinteraktiven** Interfaces (Web UIs, Mobile Apps, Desktop Apps, Terminal UIs, Dashboards, Monitoring)

Dadurch kann dein Agenten-System **jede Art von Software-Entwicklung** handhaben, nicht nur klassische Web-Apps!
