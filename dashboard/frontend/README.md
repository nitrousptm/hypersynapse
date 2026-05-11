# HYPERSYNAPSE Dashboard Frontend

React + Vite + TailwindCSS + Recharts dashboard for live development tracking.

## Run

```bash
npm install
npm run dev
```

Then open: http://localhost:5173

The frontend proxies `/api` and `/ws` to the backend at `127.0.0.1:8765`.

## Components

- **StatusCard** — Project + phase + progress + WS connection status
- **ActivityFeed** — Live agent activity stream
- **AgentTree** — Hierarchical view of all agents
- **TokenChart** — Token usage over time + top consumers
- **ControlPanel** — Hold/Resume buttons (token saving)
