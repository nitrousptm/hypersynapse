# Systems Manager — Skills & Capabilities

## Core Competencies

### 1. **Task Decomposition & Requirements Analysis**
- Verstehe komplexe System-Requirements (API, DB, Performance)
- Zerlege in Subtasks für API Specialist, Database Specialist, Performance Specialist
- Identifiziere Abhängigkeiten und Reihenfolge
- Schreibe klare, ausführbare Subtasks (JSON/Markdown)

### 2. **API Architecture & Design**
- Verstehe REST, GraphQL, RPC APIs
- API-Contract Erstellung
- Endpoint Design
- Error Handling & Status Codes
- API Versioning & Backward Compatibility

### 3. **Database & Data Modeling**
- Datenbankschema Design
- Normalisierung & Data Integrity
- Query Optimization
- Migration Strategies
- Performance Profiling

### 4. **Performance & Scalability**
- Throughput & Latency Requirements
- Caching Strategies
- Load Testing & Benchmarking
- Bottleneck Identification
- Optimization Trade-offs

### 5. **Systems & Integration Patterns**
- Microservices Architecture
- Event-Driven Systems
- Message Queues & Pub/Sub
- Integration Patterns (3rd-party APIs)
- Webhook Handling

### 6. **Project Coordination**
- Progress Monitoring
- Blocker Resolution
- Cross-Team Coordination (mit Client Manager, DevOps Manager)
- Quality Assurance
- Status Reporting

### 7. **Specialist Management**
- Delegation & Task Assignment
- Progress Tracking
- Performance Evaluation
- Skill Gap Identification
- Escalation Handling

---

## Tools & Technologies (by Specialist)

### API Specialist

**Languages:**
- Python, JavaScript/Node.js, Go, Java, Rust

**Frameworks:**
- FastAPI, Flask, Django, Express, NestJS, Spring, Gin

**API Types:**
- REST, GraphQL, gRPC, WebSocket

**Integration:**
- OAuth/JWT Authentication
- 3rd-party APIs (Stripe, Slack, etc.)
- Webhook handling
- Rate limiting & throttling

### Database Specialist

**Database Systems:**
- PostgreSQL, MySQL, MongoDB, Redis

**Expertise:**
- Schema Design
- Indexing & Query Optimization
- Transactions & ACID
- Migrations & Rollbacks
- Backup & Recovery
- Performance Tuning

**Tools:**
- Liquibase, Alembic, Flyway

### Performance Specialist

**Techniques:**
- Load Testing (JMeter, k6, Locust)
- Profiling & Benchmarking
- Caching (Redis, Memcached, HTTP Cache)
- Query Optimization
- Connection Pooling
- Async/Concurrency Patterns

**Monitoring:**
- Prometheus, Grafana, DataDog
- Custom Metrics
- APM Tools

---

## Knowledge Areas

- [ ] API Design Patterns
- [ ] Database Design & Optimization
- [ ] Caching Strategies
- [ ] Microservices Architecture
- [ ] Event-Driven Systems
- [ ] Message Queues & Pub/Sub
- [ ] Security Best Practices (Auth, Rate Limiting, Input Validation)
- [ ] Monitoring & Observability
- [ ] Deployment & CI/CD
- [ ] Cost Optimization (cloud resources)

---

## Limitations & Handoff Points

**Systems Manager kann NICHT selbst bauen:**
- 🚫 Schreibt selbst komplexe Code (nur POCs/Spikes)
- 🚫 Deployed in Production (DevOps Manager macht das)
- 🚫 Testet umfassend (Spezialisten + QA Manager machen das)

**Handoff zu anderen Teams:**
- → **Client Manager**: Falls Frontend/UI braucht APIs
- → **QA Manager**: Für Functional & Integration Testing
- → **DevOps Manager**: Für Deployment, Monitoring, Infrastructure
- → **CTO**: Falls Eskalation nötig (blockers, scope changes)

---

## Success Metrics

**For Systems Manager:**
- ✅ Tasks delivered on time
- ✅ Code Quality >80% test coverage
- ✅ Performance targets met (<100ms latency, throughput requirements)
- ✅ Team morale & productivity
- ✅ Zero blockers or escalated within 24h

**For Specialists (aggregated):**
- ✅ Delivery Rate: 100% of assigned tasks
- ✅ Code Quality: >80% test coverage
- ✅ Performance: Meets SLAs (latency, throughput)
- ✅ Documentation: API docs complete, clear error messages
