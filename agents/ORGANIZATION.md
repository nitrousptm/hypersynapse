# Organisationsstruktur

## Hierarchie-Übersicht

```
CEO (Chief Executive Officer / Orchestrator)
│
├─ HR Agent (Agent Lifecycle Management)
│
├─ CTO / Engineering Manager
│  ├─ Backend Manager
│  │  ├─ API Specialist
│  │  ├─ Database Specialist
│  │  └─ Performance Specialist
│  │
│  ├─ Frontend Manager
│  │  ├─ UI Specialist
│  │  ├─ UX Specialist
│  │  └─ Accessibility Specialist
│  │
│  ├─ DevOps Manager
│  │  ├─ CI/CD Specialist
│  │  ├─ Cloud Specialist
│  │  └─ Security Specialist
│  │
│  └─ QA Manager
│     ├─ Test Engineer
│     ├─ Automation Specialist
│     └─ Bug Analyst
│
├─ Product Manager
│  ├─ Requirement Analyst
│  └─ Documentation Specialist
│
└─ Data / AI Manager (optional)
   ├─ ML Engineer
   └─ Data Engineer
```

---

## Rollen-Matrix

| Rolle | Ebene | Reports To | Verantwortung | Typ |
|-------|-------|-----------|----------------|------|
| CEO | 1 | Nutzer | Orchestrierung, Strategic Delegation | Orchestrator |
| HR Agent | 2 | CEO | Agent Creation, Lifecycle, Removal | System |
| CTO | 2 | CEO | Engineering Koordination | Manager |
| Backend Manager | 3 | CTO | Backend Task Decomposition | Manager |
| API Specialist | 4 | Backend Mgr | API Development, Maintenance | Specialist |
| Database Specialist | 4 | Backend Mgr | DB Design, Optimization, Migrations | Specialist |
| Performance Specialist | 4 | Backend Mgr | Performance Analysis, Optimization | Specialist |
| Frontend Manager | 3 | CTO | Frontend Task Decomposition | Manager |
| UI Specialist | 4 | Frontend Mgr | UI Components, Design Implementation | Specialist |
| UX Specialist | 4 | Frontend Mgr | UX Research, Interaction Design | Specialist |
| Accessibility Specialist | 4 | Frontend Mgr | A11y Audit, WCAG Compliance | Specialist |
| DevOps Manager | 3 | CTO | Infrastructure Coordination | Manager |
| CI/CD Specialist | 4 | DevOps Mgr | Pipeline Setup, Deployment Automation | Specialist |
| Cloud Specialist | 4 | DevOps Mgr | Cloud Infrastructure, Services | Specialist |
| Security Specialist | 4 | DevOps Mgr | Security Audits, Hardening, Compliance | Specialist |
| QA Manager | 3 | CTO | Quality Assurance Coordination | Manager |
| Test Engineer | 4 | QA Mgr | Test Writing, Execution, Coverage | Specialist |
| Automation Specialist | 4 | QA Mgr | Test Automation, Framework Maintenance | Specialist |
| Bug Analyst | 4 | QA Mgr | Bug Investigation, Root Cause Analysis | Specialist |
| Product Manager | 2 | CEO | Requirements, Roadmap, Prioritization | Manager |
| Requirement Analyst | 3 | Product Mgr | Requirement Gathering, Specification | Specialist |
| Documentation Specialist | 3 | Product Mgr | Documentation, Guides, API Docs | Specialist |
| Data/AI Manager | 2 | CEO | Data & ML Strategy (optional) | Manager |
| ML Engineer | 3 | Data/AI Mgr | Model Training, Fine-tuning, Deployment | Specialist |
| Data Engineer | 3 | Data/AI Mgr | Data Pipeline, ETL, Data Quality | Specialist |

---

## Kommunikations-Regeln

**Horizontal (gleiche Ebene):**
- Manager dürfen sich koordinieren (z.B. Backend ↔ Frontend)
- Spezialisten dürfen sich NOT kontaktieren (über Manager)

**Vertikal (Hierarchie):**
- Nur eine Richtung: Up (Bericht), Down (Task)
- CEO ist zentrale Hub (sieht alles)
- Manager sind Local Hubs (sehen ihre Spezialisten)

**Eskalation:**
- Specialist Problem → Manager
- Manager Problem → CEO
- Unbekannte Task → HR Agent (neue Spezialist-Kreation)

---

## Task-Besitzrecht

| Task-Typ | Owner | Handler |
|----------|-------|---------|
| Strategic | CEO | CEO (delegiert nicht) |
| Abteilungs-Level | Manager | Manager (delegiert zu Spezialisten) |
| Konkrete Aufgabe | Specialist | Specialist (führt selbst aus) |
| Agent-Verwaltung | HR Agent | HR Agent |

---

## Metriken pro Rolle

**CEO:**
- Tasks delegiert (pro Tag)
- Eskalationen handled
- System Health Index

**Manager:**
- Tasks empfangen / delegiert
- Erfolgsquote Subtasks
- Average Task Completion Time

**Specialist:**
- Tasks completed
- Error Rate
- Expertise Score (Feedback vom Manager)

**HR Agent:**
- Agents created
- Agents removed
- Agent Health monitoring
