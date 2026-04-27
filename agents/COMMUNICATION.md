# Kommunikationsprotokolle

## Kanäle

### 1. **Task Queue** (Hauptkanal)
- **Protokoll**: JSON über Dateisystem
- **Pfad**: `agents/workspace/tasks/{status}/`
- **Flow**: pending → in_progress → done
- **Verwendung**: Alle Task-Übergaben (CEO→Manager, Manager→Specialist)

### 2. **Results Channel**
- **Protokoll**: JSON über Dateisystem
- **Pfad**: `agents/workspace/results/{agent_name}/`
- **Flow**: Specialist schreibt, Manager liest, CEO aggregiert
- **Verwendung**: Output, Artifacts, Completion Reports

### 3. **Direct Invoke** (optional, schnell)
- **Protokoll**: OpenClaw TaskFlow Event
- **Ziel**: Immediate action (z.B. HR Agent → CEO: "new agent created")
- **Verwendung**: Urgent Notifications, Escalations

### 4. **Logs & Audit Trail**
- **Protokoll**: Append-only JSON Lines
- **Pfad**: `agents/workspace/logs/`
- **Verwendung**: Activity tracking, debugging, compliance

---

## Task-Format (JSON Schema)

```json
{
  "id": "task-{uuid}",
  "created_at": "2026-04-23T11:34:00Z",
  "created_by": "ceo",
  "status": "pending|in_progress|done|failed|escalated",
  "priority": 1-5,
  "deadline": "2026-04-25T18:00:00Z",
  
  "type": "feature|bugfix|refactor|analysis|investigation",
  "title": "Human readable title",
  "description": "Detailed task description",
  
  "assigned_to": "manager_name",
  "parent_task": "task-{parent-uuid}",
  "subtasks": ["task-{uuid1}", "task-{uuid2}"],
  
  "context": {
    "project": "project_name",
    "relevant_files": ["path/to/file1.js"],
    "acceptance_criteria": [
      "criterion 1",
      "criterion 2"
    ],
    "constraints": ["no breaking changes", "must include tests"]
  },
  
  "result": {
    "status": "success|failure|partial",
    "output": "description or path to result",
    "artifacts": ["path/to/output.json"],
    "errors": ["error 1"],
    "completed_at": "2026-04-23T14:22:00Z"
  },
  
  "metadata": {
    "tags": ["backend", "api"],
    "complexity": "low|medium|high",
    "estimated_hours": 4,
    "actual_hours": 3.5
  }
}
```

---

## Kommunikations-Flows

### Flow 1: CEO → Manager

```
1. CEO writes task JSON to: agents/workspace/tasks/pending/task-{id}.json
   - assigned_to: manager_name
   - type: decompose_task OR execute_task

2. Manager reads from pending/

3. Manager writes to: agents/workspace/tasks/in_progress/task-{id}.json
   - status: in_progress
   - assigned_to: manager (if decomposing)

4. Manager either:
   a) Decomposes into subtasks (adds subtasks[])
   b) Delegates to Specialist(s)
```

### Flow 2: Manager → Specialist

```
1. Manager writes subtask JSON to: agents/workspace/tasks/pending/subtask-{id}.json
   - assigned_to: specialist_name
   - parent_task: task-{id}

2. Specialist reads, acknowledges via moving to in_progress/

3. Specialist executes and writes result to:
   agents/workspace/results/{specialist_name}/result-{id}.json

4. Specialist updates task status:
   agents/workspace/tasks/done/subtask-{id}.json
   - status: done
   - result: { status: success, output: ... }
```

### Flow 3: Escalation

```
Specialist encounters blocker
  ↓
Writes to: agents/workspace/logs/escalations.jsonl
  { agent: specialist, task_id: ..., reason: ... }

Manager polls escalations
  ↓
Either:
  a) Reassigns to different Specialist
  b) Escalates to CEO

CEO reads escalation
  ↓
Either:
  a) Reassigns to different Manager
  b) Triggers HR Agent to create new Specialist
  c) Defers/cancels Task
```

### Flow 4: HR Agent creates new Agent

```
1. HR Agent detects skill gap (no available specialist for task type)

2. HR Agent writes to: agents/workspace/tasks/pending/agent-creation-request-{id}.json
   {
     "type": "agent_creation",
     "specialist_type": "Python Backend Specialist",
     "reason": "No Python expert available",
     "skills": ["Python", "FastAPI", "PostgreSQL"]
   }

3. CEO receives notification → approves/denies

4. HR Agent creates:
   - agents/{specialist_name}/ (new directory)
   - agents/{specialist_name}/ROLE.md
   - agents/{specialist_name}/SKILLS.md
   - agents/{specialist_name}/agent.md
   - Registers in agent_registry.json

5. HR Agent notifies CEO → Task can now be assigned
```

---

## Heartbeat & Health Checks

**Every 5 minutes:**
1. Each agent writes to: `agents/workspace/health/{agent_name}.json`
   ```json
   {
     "agent": "api_specialist",
     "timestamp": "2026-04-23T11:39:00Z",
     "status": "active|idle|error",
     "tasks_active": 2,
     "last_task_completed": "2026-04-23T11:35:00Z",
     "error_count": 0
   }
   ```

2. CEO aggregates → `agents/workspace/logs/health.jsonl`

3. If agent missing heartbeat for 15 min → Flag as offline

---

## Error Handling

**Critical Errors (logged to errors.log):**
- Task parsing failure
- Uncaught exceptions in agent execution
- Resource exhaustion (disk, memory)
- Deadlock/circular dependency detection

**Agent Behavior:**
- On error: write to agents/workspace/logs/errors.jsonl
- On error: escalate immediately to manager
- On error: revert any partial changes

---

## Data Consistency

**Atomic Operations:**
- All file writes use: write → rename (avoid corruption)
- Task status transitions are single-file operations

**Conflicts:**
- If Manager and Specialist both write to same task → Last-write-wins
- Logged in: agents/workspace/logs/conflicts.jsonl

**Backups:**
- All done tasks archived daily to: agents/workspace/archive/{date}/
