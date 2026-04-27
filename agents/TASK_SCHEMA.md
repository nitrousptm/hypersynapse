# Task Schema & Lifecycle

## Complete Task Object

```json
{
  "id": "task-550e8400-e29b-41d4-a716-446655440000",
  "version": 1,
  
  "metadata": {
    "created_at": "2026-04-23T11:34:00Z",
    "created_by": "ceo",
    "updated_at": "2026-04-23T11:35:00Z",
    "updated_by": "backend_manager"
  },
  
  "assignment": {
    "assigned_to": "backend_manager",
    "parent_task": null,
    "subtasks": ["task-...", "task-..."],
    "blocked_by": [],
    "blocks": []
  },
  
  "definition": {
    "type": "feature|bugfix|refactor|investigation|analysis",
    "category": "backend|frontend|devops|qa|product|data",
    "title": "Implement user authentication API",
    "description": "Detailed task description with context...",
    
    "acceptance_criteria": [
      "JWT-based auth with 24h expiry",
      "Unit tests with >90% coverage",
      "API documentation updated",
      "No breaking changes to existing endpoints"
    ],
    
    "constraints": {
      "breaking_changes": false,
      "must_include_tests": true,
      "security_review_required": true,
      "backward_compatible": true
    },
    
    "context": {
      "project": "project_name",
      "repository": "https://github.com/org/repo",
      "relevant_files": ["src/auth/", "tests/auth/"],
      "related_issues": ["GH-123", "GH-124"],
      "related_tasks": ["task-...", "task-..."],
      "dependencies": {
        "external": ["JWT library v2.0+"],
        "internal": ["database schema must be updated first"]
      }
    },
    
    "estimation": {
      "complexity": "medium",
      "estimated_hours": 8,
      "estimated_days": 1,
      "skills_required": ["Python", "FastAPI", "PostgreSQL", "Security"],
      "seniority_required": "mid-level"
    }
  },
  
  "execution": {
    "status": "pending|assigned|in_progress|blocked|done|failed|escalated|deferred",
    
    "timeline": {
      "deadline": "2026-04-25T18:00:00Z",
      "priority": 3,
      "started_at": "2026-04-23T11:35:00Z",
      "completed_at": null
    },
    
    "progress": {
      "percent_complete": 0,
      "notes": "Starting implementation...",
      "last_update": "2026-04-23T11:35:00Z"
    },
    
    "result": {
      "status": "success|failure|partial|not_applicable",
      "summary": "Brief summary of what was accomplished",
      "artifacts": [
        {
          "type": "code|documentation|test|analysis",
          "path": "agents/workspace/results/backend_specialist/auth-api.md",
          "description": "API endpoint documentation"
        }
      ],
      "metrics": {
        "time_spent_hours": 7.5,
        "tests_added": 45,
        "test_coverage": "94%",
        "performance_impact": "neutral"
      },
      "errors": [],
      "warnings": ["Consider adding rate limiting"]
    }
  },
  
  "communication": {
    "assigned_agent": {
      "name": "backend_manager",
      "agent_id": "agent-backend-manager-001",
      "acknowledged_at": "2026-04-23T11:35:00Z"
    },
    
    "escalations": [
      {
        "escalated_at": "2026-04-23T13:00:00Z",
        "escalated_by": "backend_specialist",
        "escalated_to": "backend_manager",
        "reason": "Unclear requirements on token refresh strategy",
        "resolution": "CEO clarified in task comment"
      }
    ],
    
    "comments": [
      {
        "author": "ceo",
        "timestamp": "2026-04-23T11:34:00Z",
        "text": "Please coordinate with frontend team on token storage."
      },
      {
        "author": "frontend_manager",
        "timestamp": "2026-04-23T12:00:00Z",
        "text": "We'll use localStorage for now, plan to migrate to secure cookies in v2."
      }
    ]
  },
  
  "quality": {
    "review_status": "pending|in_review|approved|changes_requested|rejected",
    "reviewer": "qa_manager",
    "review_date": null,
    "review_feedback": null,
    "test_coverage": 94,
    "test_status": "pass|fail|partial"
  }
}
```

---

## Task Lifecycle States

```
pending
  ↓ (assigned to manager)
assigned
  ↓ (manager starts decomposition or delegation)
in_progress
  ↓ (either completes successfully OR encounters issue)
  ├─ done (completion → move to results)
  ├─ failed (unrecoverable error)
  ├─ blocked (waiting for external input/dependency)
  ├─ escalated (needs higher-level decision)
  └─ deferred (not now, move to backlog)
```

### State Transitions

| From | To | Trigger | Handler |
|------|-----|---------|---------|
| pending | assigned | Task read by manager | Manager |
| assigned | in_progress | Manager starts work | Manager |
| in_progress | done | Task complete, result written | Specialist/Manager |
| in_progress | blocked | Waiting for dependency | Agent |
| in_progress | escalated | Issue requires higher authority | Manager/Specialist |
| in_progress | failed | Unrecoverable error | Agent |
| blocked | in_progress | Blocker resolved | Manager |
| escalated | in_progress | Escalation resolved | CEO |
| any | deferred | Deprioritized | CEO |

---

## Task Types & Handlers

| Type | Typically Assigned To | Decomposition | Key Metadata |
|------|------------------|-----------------|--------------|
| feature | Backend/Frontend Manager | Yes | acceptance_criteria, estimate |
| bugfix | QA Manager (triage) → relevant Specialist | Possibly | severity, reproduction_steps |
| refactor | Engineering Manager | Possibly | scope, risk_level |
| investigation | Specialist directly | No | research_scope, output_format |
| analysis | Specialist or Manager | No | analysis_scope, deliverable |

---

## Result Format (in results/{agent}/result-{id}.json)

```json
{
  "task_id": "task-550e8400-e29b-41d4-a716-446655440000",
  "agent": "backend_specialist",
  "completed_at": "2026-04-23T14:22:00Z",
  
  "status": "success|failure|partial",
  
  "deliverables": {
    "code": {
      "repository": "https://github.com/org/repo",
      "branch": "feature/auth-api",
      "commits": ["abc123def456", "def456ghi789"],
      "files_changed": 15,
      "lines_added": 450,
      "lines_removed": 50
    },
    "documentation": [
      {
        "title": "API Authentication Guide",
        "path": "docs/auth.md",
        "updated": true
      }
    ],
    "tests": {
      "total": 45,
      "passed": 45,
      "failed": 0,
      "coverage": 94
    }
  },
  
  "quality_metrics": {
    "code_review_status": "pending|approved|changes_requested",
    "performance_impact": "neutral|positive|negative",
    "security_concerns": false,
    "breaking_changes": false
  },
  
  "summary": "Successfully implemented JWT-based authentication API with comprehensive test coverage. All acceptance criteria met. Ready for deployment.",
  
  "next_steps": [
    "Frontend team to integrate endpoints",
    "DevOps to deploy to staging",
    "QA to run full regression"
  ]
}
```

---

## Subtask Pattern

When a Manager decomposes a task, they create subtasks:

```json
{
  "id": "subtask-...",
  "parent_task": "task-550e8400-e29b-41d4-a716-446655440000",
  "type": "feature_subtask",
  
  "definition": {
    "title": "Create JWT token generation utility",
    "description": "...",
    "acceptance_criteria": [...]
  },
  
  "assignment": {
    "assigned_to": "api_specialist",
    "assigned_by": "backend_manager"
  },
  
  "dependencies": {
    "blocked_by": [],
    "must_complete_before": ["subtask-...", "subtask-..."]
  }
}
```

**Manager ensures:**
- Subtasks don't have circular dependencies
- Each subtask is independently completable
- Total scope = original task scope
- Clear hand-off points between specialists

---

## Error Codes

| Code | Severity | Meaning | Recovery |
|------|----------|---------|----------|
| E001 | CRITICAL | Parsing error in task JSON | Reject task, notify CEO |
| E002 | HIGH | Required field missing | Escalate to requester |
| E003 | HIGH | Skill unavailable | Escalate to HR Agent |
| E004 | MEDIUM | Task blocked by dependency | Wait, retry later |
| E005 | HIGH | Test coverage below threshold | Reject, request fixes |
| E006 | CRITICAL | Security review failed | Escalate to Security Specialist |

---

## Archival & Retention

- **Done tasks**: Archived daily to `agents/workspace/archive/{YYYY-MM-DD}/`
- **Retention**: 90 days in active workspace, then moved to cold storage
- **Audit**: All task history preserved in logs/task_lifecycle.jsonl
