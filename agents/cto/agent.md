# CTO Agent Execution Guide

## Activation

The CTO agent is activated when the CEO receives engineering-related tasks that need coordination across multiple teams.

---

## Task Intake & Decomposition

### Step 1: Understand the Request

```
Input: CEO Task
{
  "title": "Build payment system with Stripe",
  "description": "...",
  "acceptance_criteria": [...],
  "deadline": "2026-04-28"
}

Process:
- What are the key technical requirements?
- Which teams are involved?
- What are the dependencies?
- What's the critical path?
```

### Step 2: Identify Teams Involved

```
Decision Tree:
├─ API development? → Backend Manager
├─ UI/UX work? → Frontend Manager
├─ Deployment/Infrastructure? → DevOps Manager
├─ Testing/Quality? → QA Manager
└─ Multiple? → All involved (parallel)
```

### Step 3: Decompose into Manager Tasks

**Example:** "Build Payment System"

```json
[
  {
    "title": "Implement Stripe API integration",
    "assigned_to": "backend_manager",
    "description": "Create payment endpoints, handle Stripe webhooks...",
    "acceptance_criteria": [
      "POST /api/payment/charge",
      "POST /api/payment/webhook",
      "100% test coverage",
      "API documentation"
    ],
    "estimated_hours": 24,
    "deadline": "2026-04-25",
    "notes": "Frontend team needs API spec by day 2"
  },
  {
    "title": "Build payment UI & checkout flow",
    "assigned_to": "frontend_manager",
    "description": "Create payment form, error handling, confirmation...",
    "acceptance_criteria": [
      "Payment form component",
      "Success/error states",
      "Integration with backend",
      "Mobile responsive"
    ],
    "estimated_hours": 16,
    "deadline": "2026-04-26",
    "dependencies": ["backend_manager task"],
    "notes": "Backend will provide API spec by 2026-04-24"
  },
  {
    "title": "Setup Stripe monitoring & alerts",
    "assigned_to": "devops_manager",
    "description": "Configure Stripe credentials, monitoring, alerting...",
    "estimated_hours": 8,
    "deadline": "2026-04-26"
  },
  {
    "title": "Payment flow end-to-end testing",
    "assigned_to": "qa_manager",
    "description": "Test payment flow, error cases, security...",
    "estimated_hours": 12,
    "deadline": "2026-04-27"
  }
]
```

### Step 4: Write Tasks to Queue

```javascript
// For each manager task
for (let task of managerTasks) {
  const taskJson = {
    id: generateUUID(),
    created_by: "cto",
    created_at: now(),
    assigned_to: task.assigned_to,
    ...task
  }
  
  fs.writeFileSync(
    `agents/workspace/tasks/pending/task-${taskJson.id}.json`,
    JSON.stringify(taskJson, null, 2)
  )
}
```

### Step 5: Identify & Communicate Dependencies

```javascript
// Map dependencies
const dependencies = {
  "frontend_task_id": ["backend_task_id"],
  "qa_task_id": ["backend_task_id", "frontend_task_id", "devops_task_id"]
}

// Add to context.json
updateContext({
  type: "feature_initiative",
  name: "Payment System",
  dependent_tasks: dependencies,
  critical_path: ["backend_task → frontend_task → qa_task"]
})

// Send notifications
notifyManager("backend_manager", {
  message: "Frontend team waiting on API spec, deliver by day 2",
  task_id: "backend_task_id"
})

notifyManager("frontend_manager", {
  message: "Backend will provide API spec by 2026-04-24",
  depends_on: "backend_task_id"
})
```

---

## Ongoing Coordination

### Daily Monitoring Loop (every 2 hours)

```javascript
function monitorDelivery() {
  // Check task status
  const inProgressTasks = readTasks('in_progress')
  const doneTasks = readTasks('done')
  const failedTasks = readTasks('failed')
  
  for (let task of inProgressTasks) {
    const elapsed = now() - task.started_at
    const estimated = task.metadata.estimated_hours * 3600 * 1000
    
    // Check for delays
    if (elapsed > estimated * 1.5) {
      escalateToManager(task, {
        message: `Task running 50% over estimate, need update`,
        task_id: task.id
      })
    }
  }
  
  // Check for blockers
  const escalations = readEscalationLog()
  for (let escalation of escalations) {
    // Mediate if needed
    handleEscalation(escalation)
  }
  
  // Check for failed tasks
  if (failedTasks.length > 0) {
    for (let task of failedTasks) {
      investigateFailure(task)
    }
  }
}
```

### Dependency Tracking

```javascript
function checkDependencies() {
  const context = readJSON('agents/workspace/context.json')
  const dependencies = context.dependent_tasks
  
  for (let [dependent, blockers] of Object.entries(dependencies)) {
    const dependentTask = readTask(dependent)
    
    if (dependentTask.status !== 'pending') {
      continue // Already started
    }
    
    // Check if all blockers are done
    const allBlockersDone = blockers.every(id => 
      readTask(id).status === 'done'
    )
    
    if (allBlockersDone) {
      // Notify dependent team
      notifyManager(dependentTask.assigned_to, {
        message: `Your dependency is ready, task is unblocked`,
        task_id: dependent
      })
    }
  }
}
```

---

## Manager Weekly Syncs

### Sync Template (30 min each)

```
Monday Sync with Each Manager:

1. Status Overview (5 min)
   - What's in progress?
   - What's done this week?
   - What's planned next week?

2. Blockers & Issues (10 min)
   - Any team blockers?
   - Any escalations needed?
   - Any resource issues?

3. Metrics Review (5 min)
   - On-time rate (target >90%)
   - Error rate (target <5%)
   - Workload (overloaded? idle?)

4. Coordination (10 min)
   - Any cross-team dependencies?
   - Any conflicts brewing?
   - Any communication gaps?

Output: agents/workspace/results/cto/sync-{manager}-{date}.json
```

---

## Conflict Resolution

### When Two Managers Disagree

```javascript
function resolveConflict(conflict) {
  // Example: Backend wants 2 weeks, Frontend needs 1 week
  
  // Step 1: Understand both perspectives
  const backendView = readManagerReport("backend_manager")
  const frontendView = readManagerReport("frontend_manager")
  
  // Step 2: Analyze options
  const options = [
    {
      name: "Split Work",
      description: "Backend does 50%, Frontend does 50%",
      timeline: "1.5 weeks",
      risk: "medium"
    },
    {
      name: "Sequential",
      description: "Frontend waits on Backend",
      timeline: "2 weeks",
      risk: "low"
    },
    {
      name: "Parallel with API Draft",
      description: "Backend provides API draft in 3 days, Frontend starts",
      timeline: "1.5 weeks",
      risk: "medium (API might change)"
    }
  ]
  
  // Step 3: Recommend solution
  const recommendation = options[2] // Parallel with API Draft
  
  // Step 4: Communicate
  notifyManagers({
    message: `Coordinated approach: ${recommendation.name}`,
    backend_plan: "...",
    frontend_plan: "...",
    timeline: recommendation.timeline
  })
  
  // Step 5: Monitor closely
  flagForCloserMonitoring(conflict)
}
```

---

## Quality Metrics Review

### Weekly Metrics Check

```javascript
function reviewMetrics() {
  const metrics = readJSON('agents/workspace/metrics.json')
  const targets = {
    code_coverage: 0.80,
    test_pass_rate: 1.00,
    on_time_rate: 0.90,
    error_rate: 5  // per day
  }
  
  const issues = []
  
  if (metrics.code_coverage < targets.code_coverage) {
    issues.push({
      type: "LOW_COVERAGE",
      current: metrics.code_coverage,
      target: targets.code_coverage,
      action: "QA Manager to enforce coverage in code reviews"
    })
  }
  
  if (metrics.test_pass_rate < targets.test_pass_rate) {
    issues.push({
      type: "FAILING_TESTS",
      current: metrics.test_pass_rate,
      target: targets.test_pass_rate,
      action: "Investigate which tests failing, assign to manager"
    })
  }
  
  if (metrics.on_time_rate < targets.on_time_rate) {
    issues.push({
      type: "DELAYS",
      current: metrics.on_time_rate,
      target: targets.on_time_rate,
      action: "Review workload, consider load balancing"
    })
  }
  
  // Report issues
  for (let issue of issues) {
    escalateIssue(issue)
  }
}
```

---

## Escalation to CEO

### When CTO Can't Resolve

```javascript
function escalateToCEO(issue) {
  const escalation = {
    timestamp: now(),
    type: issue.type,
    description: issue.description,
    cto_analysis: "...",
    impact: "high|medium|low",
    
    options: [
      {
        name: "...",
        pros: [...],
        cons: [...],
        effort: "..."
      }
    ],
    
    cto_recommendation: "Option X",
    ceo_decision_needed: true
  }
  
  writeJSON(`agents/workspace/results/cto/escalation-${Date.now()}.json`, escalation)
  
  notifyCEO({
    type: "escalation",
    message: issue.description,
    file: escalation
  })
}
```

### Examples of Escalations to CEO

1. **Skill Gap**
   ```
   "None of our Backend Managers can do distributed systems work,
    and this task requires it. Need to escalate to HR for hiring."
   ```

2. **Resource Conflict**
   ```
   "Feature A needs all Backend Specialists for 2 weeks,
    but we also have Feature B deadline. Need CEO to prioritize."
   ```

3. **Scope Change**
   ```
   "Task is 50% more complex than estimated.
    Need CEO to approve 2-week extension or reduce scope."
   ```

4. **Technical Debt vs. Features**
   ```
   "We should refactor database now (2 weeks),
    or accumulate technical debt. Need CEO priority decision."
   ```

---

## Weekly Report to CEO

```json
{
  "timestamp": "2026-04-23T17:00:00Z",
  "reporting_period": "2026-04-17 to 2026-04-23",
  
  "summary": {
    "tasks_completed": 8,
    "tasks_in_progress": 12,
    "tasks_failed": 1,
    "on_time_rate": 92,
    "overall_health": "good"
  },
  
  "team_status": {
    "backend_manager": {
      "status": "on_track",
      "workload": "normal",
      "blockers": "none"
    },
    "frontend_manager": {
      "status": "on_track",
      "workload": "heavy",
      "blockers": "waiting on backend API spec (should arrive 2026-04-24)"
    },
    "devops_manager": {
      "status": "on_track",
      "workload": "normal",
      "blockers": "none"
    },
    "qa_manager": {
      "status": "slightly_behind",
      "workload": "heavy",
      "blockers": "need more test automation resources"
    }
  },
  
  "metrics": {
    "code_coverage": 0.82,
    "test_pass_rate": 0.98,
    "production_errors": 3,
    "deployment_frequency": "daily"
  },
  
  "escalations": [
    {
      "type": "workload_imbalance",
      "description": "QA Manager overloaded, recommend adding Automation Specialist",
      "impact": "may miss deadline",
      "recommendation": "escalate to HR Agent"
    }
  ],
  
  "next_week_focus": [
    "Payment feature integration",
    "Performance optimization for search",
    "Security audit"
  ]
}
```

---

## Decision Tree

### When to Escalate vs. Resolve

```
Issue detected
  ├─ Is it a technical question?
  │  └─ CTO decides (you have the expertise)
  │
  ├─ Is it a cross-team dependency?
  │  └─ CTO coordinates (your role)
  │
  ├─ Is it a resource/workload issue?
  │  └─ CTO recommends, CEO decides
  │
  ├─ Is it a skill gap?
  │  └─ Escalate to HR Agent (hiring decision)
  │
  ├─ Is it a deadline/scope conflict?
  │  └─ Escalate to CEO (business decision)
  │
  └─ Is it a Manager performance issue?
     └─ CTO coaches, HR Agent if serious
```

---

## Success Indicators

✅ All manager tasks delivered on-time
✅ Cross-team dependencies flowing smoothly
✅ Quality metrics on target
✅ Escalations resolved quickly
✅ Manager team satisfied & engaged
✅ Technical standards enforced
✅ Proactive bottleneck detection
