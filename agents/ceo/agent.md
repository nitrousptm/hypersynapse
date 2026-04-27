# CEO Agent Execution Guide

## Activation

The CEO agent is activated via OpenClaw TaskFlow when a new Nutzer request arrives.

```
Input: User task via TaskFlow
Process: system_prompt.md + TASK_SCHEMA.md context
Output: Decomposed tasks in agents/workspace/tasks/pending/
```

---

## Execution Loop

### Step 1: Parse Nutzer Request
```
Input: {
  "type": "user_request",
  "content": "Build a login page for the web app"
}

Processing:
- Extract core request
- Identify project context (from context.json)
- Identify affected teams
- Recognize constraints
```

### Step 2: Decompose into Manager Tasks
```
Example decomposition:

User Request: "Build a login page for the web app"

↓ CEO Decomposes to:

1. Backend Task (→ Backend Manager):
   - Implement /api/auth/login endpoint
   - POST username+password, return JWT
   - 24h expiry, refresh token

2. Frontend Task (→ Frontend Manager):
   - Build login UI component
   - Handle auth errors gracefully
   - Store JWT (coordinate with backend on approach)

3. QA Task (→ QA Manager):
   - Test login flow end-to-end
   - Security testing (SQL injection, etc.)
   - Cross-browser testing

4. DevOps Task (→ DevOps Manager) [Optional]:
   - Ensure login endpoint is rate-limited
   - Add to monitoring/alerting
```

### Step 3: Write Tasks to Queue

For each decomposed task:

```javascript
// Pseudo-code
for (let task of decomposedTasks) {
  const taskJson = {
    id: generateUUID(),
    created_by: "ceo",
    created_at: now(),
    assigned_to: task.manager,
    type: task.type,
    title: task.title,
    description: task.description,
    acceptance_criteria: task.criteria,
    priority: task.priority,
    deadline: calculateDeadline(task.estimatedHours),
    context: {
      project: currentProject,
      related_tasks: [otherTaskIds],
      cross_team_note: (if applicable)
    }
  }
  
  // Write to pending queue
  fs.writeFileSync(
    `agents/workspace/tasks/pending/task-${taskJson.id}.json`,
    JSON.stringify(taskJson, null, 2)
  )
}
```

### Step 4: Notify Managers

After writing tasks:

```
For each Manager:
- Send TaskFlow event: "New tasks assigned"
- Include brief summary
- Expected response time: <30 min
```

### Step 5: Monitor Progress

Ongoing (every 5 minutes):

```javascript
// Check for Manager updates
const inProgress = fs.readdirSync('agents/workspace/tasks/in_progress/')
const done = fs.readdirSync('agents/workspace/tasks/done/')

// Aggregate status
const status = {
  total_tasks: decomposedTasks.length,
  completed: done.length,
  in_progress: inProgress.length,
  pending: totalTasks - completed - inProgress,
  percent_complete: (completed + inProgress) / totalTasks
}

// Log
fs.appendFileSync('agents/workspace/logs/ceo.log', 
  JSON.stringify({timestamp: now(), status}))
```

### Step 6: Detect Issues & Escalate

Monitor for:

```javascript
const issues = []

// Check for stuck tasks
for (let task of inProgressTasks) {
  const elapsed = now() - task.started_at
  const estimated = task.metadata.estimated_hours * 3600 * 1000
  
  if (elapsed > estimated * 2) {
    issues.push({
      type: "STUCK_TASK",
      task: task.id,
      elapsed_hours: elapsed / 3600 / 1000
    })
  }
}

// Check for escalations
const escalations = readEscalationLog()
if (escalations.length > 0) {
  issues.push({
    type: "ESCALATION_RECEIVED",
    escalations: escalations
  })
}

// Check for offline managers
const health = readHealthCheck()
for (let manager of allManagers) {
  if (health[manager].last_heartbeat > 15 * 60 * 1000) {
    issues.push({
      type: "MANAGER_OFFLINE",
      manager: manager
    })
  }
}

// Take action
if (issues.length > 0) {
  for (let issue of issues) {
    handleEscalation(issue)
  }
}
```

### Step 7: Aggregate & Report

When all tasks complete:

```javascript
const report = {
  original_request: nutzerRequest.content,
  tasks_created: decomposedTasks.length,
  tasks_completed: completedTasks,
  timeline: {
    started: originalTaskTime,
    completed: now(),
    total_hours: (now() - originalTaskTime) / 3600 / 1000
  },
  results: {
    backend: backendManagerReport,
    frontend: frontendManagerReport,
    qa: qaManagerReport,
    devops: devopsManagerReport
  },
  summary: generateNarrativeSummary(results),
  artifacts: collectArtifacts(results)
}

fs.writeFileSync(
  `agents/workspace/results/ceo/report-${originalTaskId}.json`,
  JSON.stringify(report, null, 2)
)

// Send to Nutzer via TaskFlow
notifyNutzer(report)
```

---

## Context Persistence

### agents/workspace/context.json

Maintain a running context:

```json
{
  "current_project": {
    "name": "web-app-v2",
    "description": "...",
    "status": "in_development"
  },
  
  "active_initiatives": [
    {
      "name": "Authentication System",
      "owner": "backend_manager",
      "status": "in_progress",
      "started": "2026-04-23T10:00:00Z",
      "related_tasks": ["task-1", "task-2", "task-3"]
    }
  ],
  
  "dependencies": {
    "task-1": ["task-2", "task-3"],
    "task-2": ["task-4"]
  },
  
  "blockers": [
    {
      "task": "task-5",
      "blocked_by": "task-4",
      "reason": "Awaiting database schema"
    }
  ],
  
  "agents_offline": [],
  "last_update": "2026-04-23T11:45:00Z"
}
```

**Update this after each Manager report.**

---

## Decision Tree: When to Escalate to HR Agent

```
Is there a task with:
  └─ Type = "feature|bugfix|refactor"
     AND
     └─ Required skill NOT in any specialist's profile?

       YES → Escalate to HR Agent
             {
               "type": "skill_gap",
               "task": task_id,
               "required_skill": "Rust programming",
               "reason": "No Rust specialist available"
             }
       
       NO → Continue normal flow
```

---

## Error Handling

| Error | Recovery |
|-------|----------|
| Task parsing failed | Log, notify Nutzer, request clarification |
| Manager not responding | Wait 30min, then escalate to system admin |
| Skill gap identified | Trigger HR Agent |
| Circular dependency detected | Reject composition, redesign, try again |
| Resource exhausted | Defer low-priority tasks |

---

## System Prompt Reference

Use `system_prompt.md` for:
- Few-shot examples of good decomposition
- Task writing style guidelines
- Decision criteria for delegation
- Escalation thresholds
