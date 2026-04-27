# HR Agent Execution Guide

## Core Loop

```
Every 5 minutes:
1. Read heartbeats from agents/workspace/health/
2. Analyze health metrics
3. Detect issues (offline, overloaded, errors)
4. Write report to agents/workspace/logs/
5. Alert CEO if critical issue
```

---

## Task 1: Health Monitoring

```javascript
function monitorHealth() {
  const heartbeatDir = 'agents/workspace/health/'
  const agentRegistry = readJSON('agent_registry.json')
  const now = Date.now()
  const OFFLINE_THRESHOLD = 15 * 60 * 1000  // 15 minutes
  const ERROR_THRESHOLD = 5  // errors per hour
  
  const issues = []
  
  for (let agent of Object.keys(agentRegistry)) {
    const heartbeat = readJSON(`${heartbeatDir}${agent}.json`)
    
    if (!heartbeat) {
      issues.push({
        type: "NO_HEARTBEAT",
        agent: agent,
        severity: "HIGH"
      })
      continue
    }
    
    const timeSinceHeartbeat = now - heartbeat.timestamp
    
    // Check offline
    if (timeSinceHeartbeat > OFFLINE_THRESHOLD) {
      issues.push({
        type: "AGENT_OFFLINE",
        agent: agent,
        severity: "CRITICAL",
        last_seen: heartbeat.timestamp,
        duration_ms: timeSinceHeartbeat
      })
    }
    
    // Check error rate
    if (heartbeat.error_count > ERROR_THRESHOLD) {
      issues.push({
        type: "HIGH_ERROR_RATE",
        agent: agent,
        severity: "HIGH",
        error_count: heartbeat.error_count
      })
    }
    
    // Check workload
    if (heartbeat.tasks_active > 5) {
      issues.push({
        type: "OVERLOADED",
        agent: agent,
        severity: "MEDIUM",
        active_tasks: heartbeat.tasks_active
      })
    }
  }
  
  return issues
}
```

**Action on Issues:**
- CRITICAL: Escalate to CEO immediately
- HIGH: Log, monitor closely
- MEDIUM: Recommend action to CEO

---

## Task 2: Skill Gap Evaluation

When CEO sends skill_gap escalation:

```javascript
function evaluateSkillGap(escalation) {
  const skillRegistry = readJSON('skill_registry.json')
  const agentRegistry = readJSON('agent_registry.json')
  
  const requiredSkill = escalation.required_skill
  const taskId = escalation.task_id
  
  // Check if skill exists
  if (skillRegistry[requiredSkill]) {
    // Skill exists, agents can handle it
    const agents = skillRegistry[requiredSkill].agents
    console.log(`Skill ${requiredSkill} available in: ${agents}`)
    return {
      decision: "USE_EXISTING",
      agents_available: agents
    }
  }
  
  // Skill missing - need new agent
  const frequency = evaluateFrequency(requiredSkill, taskId)
  
  if (frequency === "rare") {
    return {
      decision: "DEFER",
      reason: "Skill gap is rare, defer or alternative approach"
    }
  }
  
  if (frequency === "frequent") {
    return {
      decision: "CREATE_NEW_AGENT",
      skill: requiredSkill,
      specialist_type: suggestSpecialistType(requiredSkill)
    }
  }
  
  // occasional
  return {
    decision: "EVALUATE",
    reason: "Skill gap occasional, CEO decides"
  }
}
```

**Output to CEO:**
```json
{
  "escalation_id": "escalation-123",
  "request": "skill_gap for Rust",
  "evaluation": {
    "decision": "CREATE_NEW_AGENT",
    "skill": "Rust",
    "specialist_type": "Rust Backend Specialist",
    "reasoning": "Task requires Rust, no current specialist, high skill demand"
  },
  "recommendation": "Create new specialist 'rust_backend_specialist'"
}
```

---

## Task 3: Agent Creation

When approved by CEO:

```javascript
function createAgent(approval) {
  const agentName = approval.specialist_type
    .toLowerCase()
    .replace(/\s+/g, '_')
  
  // Create directory
  fs.mkdirSync(`agents/${agentName}`, { recursive: true })
  
  // Copy template files
  const template = 'agents/_templates/specialist'
  fs.copyRecursive(template, `agents/${agentName}`)
  
  // Customize files
  const roleContent = fs.readFileSync(`agents/${agentName}/ROLE.md`, 'utf8')
    .replace('{{SPECIALIST_TYPE}}', approval.specialist_type)
    .replace('{{SKILLS}}', approval.skills.join(', '))
  
  fs.writeFileSync(`agents/${agentName}/ROLE.md`, roleContent)
  
  // Create registry entry
  const agentId = `agent-${agentName}-${Date.now()}`
  const registryEntry = {
    agent_name: agentName,
    agent_id: agentId,
    created_at: new Date().toISOString(),
    created_for_task: approval.task_id,
    reports_to: approval.reports_to || "backend_manager",
    skills: approval.skills || [],
    status: "active"
  }
  
  // Update registries
  const agentRegistry = readJSON('agent_registry.json')
  agentRegistry[agentName] = registryEntry
  writeJSON('agent_registry.json', agentRegistry)
  
  const skillRegistry = readJSON('skill_registry.json')
  for (let skill of registryEntry.skills) {
    if (!skillRegistry[skill]) {
      skillRegistry[skill] = { agents: [], mastery_levels: {} }
    }
    skillRegistry[skill].agents.push(agentName)
    skillRegistry[skill].mastery_levels[agentName] = "intermediate"
  }
  writeJSON('skill_registry.json', skillRegistry)
  
  // Report to CEO
  writeJSON(`agents/workspace/results/hr_agent/creation-${Date.now()}.json`, {
    action: "agent_created",
    agent_name: agentName,
    agent_id: agentId,
    created_at: new Date().toISOString(),
    created_for_task: approval.task_id,
    status: "ready"
  })
  
  console.log(`Created agent: ${agentName}`)
}
```

---

## Task 4: Workload Analysis

```javascript
function analyzeWorkload() {
  const agentRegistry = readJSON('agent_registry.json')
  const workspace = readWorkspace()
  
  const workloadReport = {}
  
  for (let agentName of Object.keys(agentRegistry)) {
    // Count active tasks
    const inProgressTasks = workspace.tasks.filter(t => 
      t.status === 'in_progress' && t.assigned_to === agentName
    )
    
    // Get avg completion time
    const doneTasks = workspace.tasks.filter(t =>
      t.status === 'done' && t.assigned_to === agentName
    )
    const avgTime = doneTasks.reduce((sum, t) => 
      sum + (t.result.completed_at - t.started_at), 0
    ) / doneTasks.length
    
    workloadReport[agentName] = {
      active_tasks: inProgressTasks.length,
      avg_completion_time: avgTime,
      workload_rating: inProgressTasks.length > 5 ? "OVERLOADED" : 
                      inProgressTasks.length === 0 ? "IDLE" : "NORMAL"
    }
  }
  
  return workloadReport
}
```

**Output to CEO:**
```json
{
  "type": "workload_analysis",
  "timestamp": "2026-04-23T11:50:00Z",
  "agents": {
    "api_specialist": {
      "active_tasks": 5,
      "avg_completion_time_hours": 8,
      "workload_rating": "NORMAL"
    },
    "database_specialist": {
      "active_tasks": 2,
      "avg_completion_time_hours": 6,
      "workload_rating": "NORMAL"
    }
  },
  "recommendations": []
}
```

---

## Task 5: Performance Report

```javascript
function generatePerformanceReport(period = 30) {
  // period in days
  const tasks = readTaskHistory(period)
  const agentRegistry = readJSON('agent_registry.json')
  
  const report = {}
  
  for (let agentName of Object.keys(agentRegistry)) {
    const agentTasks = tasks.filter(t => t.assigned_to === agentName)
    
    const completed = agentTasks.filter(t => t.status === 'done')
    const failed = agentTasks.filter(t => t.status === 'failed')
    const total = agentTasks.length
    
    const onTime = completed.filter(t => t.completed_at <= t.deadline)
    
    report[agentName] = {
      period_days: period,
      tasks_completed: completed.length,
      tasks_failed: failed.length,
      success_rate: ((completed.length / total) * 100).toFixed(1),
      on_time_rate: ((onTime.length / completed.length) * 100).toFixed(1),
      avg_completion_time_hours: (completed.reduce((sum, t) =>
        sum + (t.result.completed_at - t.started_at) / 3600 / 1000, 0
      ) / completed.length).toFixed(1)
    }
  }
  
  return report
}
```

---

## Logging & Reporting

**Log heartbeat analysis:**
```
agents/workspace/logs/hr_agent.log (append-only)

Each 5-min check:
{
  "timestamp": "2026-04-23T11:50:00Z",
  "type": "health_check",
  "agents_checked": 15,
  "agents_healthy": 15,
  "agents_offline": 0,
  "issues_found": 0
}
```

**Critical alerts:**
```
agents/workspace/logs/alerts.jsonl

{
  "timestamp": "2026-04-23T11:50:00Z",
  "severity": "CRITICAL",
  "type": "agent_offline",
  "agent": "api_specialist",
  "last_heartbeat": "2026-04-23T11:35:00Z"
}
```

---

## Template System

When creating new agent, HR Agent uses templates:

```
agents/_templates/
├── specialist/
│   ├── ROLE.md
│   ├── SKILLS.md
│   ├── agent.md
│   └── system_prompt.md
│
├── manager/
│   ├── ROLE.md
│   ├── SKILLS.md
│   ├── agent.md
│   └── system_prompt.md
│
└── README.md (template usage guide)
```

Templates have placeholders like `{{SPECIALIST_TYPE}}`, `{{SKILLS}}` that HR Agent replaces during creation.
