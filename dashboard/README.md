# HYPERSYNAPSE Dashboard

Live dashboard for tracking development progress, agent activities, and token usage.

## Quick Start

Two terminals:

```bash
# Terminal 1 — Backend
cd dashboard/backend
npm install
npm start

# Terminal 2 — Frontend
cd dashboard/frontend
npm install
npm run dev
```

Open: http://localhost:5173

## Architecture

```
┌─────────────────┐     HTTP/WS     ┌─────────────────┐
│   Frontend      │ ──────────────> │    Backend      │
│ React + Vite    │ <────────────── │ Fastify + WS    │
│ localhost:5173  │   /api  /ws     │ localhost:8765  │
└─────────────────┘                 └────────┬────────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │  state/         │
                                    │  - state.json   │
                                    │  - activities   │
                                    │  - tokens.json  │
                                    │  - agents.json  │
                                    └─────────────────┘
```

## Updating dashboard from agent code

Agents (or scripts representing them) POST updates to the backend:

```bash
# Log activity
curl -X POST http://127.0.0.1:8765/api/activity \
  -H "Content-Type: application/json" \
  -d '{"agent":"VFX Developer","action":"Implementing particle shader","status":"in_progress"}'

# Track tokens
curl -X POST http://127.0.0.1:8765/api/tokens/add \
  -H "Content-Type: application/json" \
  -d '{"agent":"VFX Developer","count":1234}'

# Update phase
curl -X POST http://127.0.0.1:8765/api/state \
  -H "Content-Type: application/json" \
  -d '{"phase":"A.2","phaseName":"Live Updates","phaseProgress":0}'
```

## On-Hold Mechanism

Click `⏸ Pause All Agents` in the UI. This sets `state.hold = true`, which:

- Agent runners check before consuming tokens
- Activities log a `paused` status
- Resume by clicking `▶ Resume Development`

State is persisted in `dashboard/backend/state/state.json`.
