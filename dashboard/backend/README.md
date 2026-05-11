# HYPERSYNAPSE Dashboard Backend

Fastify + WebSocket server providing live data for the dashboard frontend.

## Run

```bash
npm install
npm start
```

Default port: `8765` (override via `PORT` env).

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/status` | Project state (phase, progress, hold) |
| GET | `/api/activities?limit=50` | Recent activities |
| GET | `/api/tokens` | Token usage stats |
| GET | `/api/agents` | Agent hierarchy |
| POST | `/api/hold` | Set hold (body: `{ reason }`) |
| POST | `/api/resume` | Resume from hold |
| POST | `/api/activity` | Log new activity |
| POST | `/api/tokens/add` | Increment token count |
| POST | `/api/state` | Update state fields |
| POST | `/api/agents` | Update agent hierarchy |
| WS | `/ws` | Live updates (events: `activity_new`, `state_change`, `tokens_update`, `agents_update`) |

## State files

Stored in `state/`:
- `state.json` — current phase + progress + hold
- `activities.jsonl` — append-only activity log
- `tokens.json` — token usage
- `agents.json` — agent hierarchy
