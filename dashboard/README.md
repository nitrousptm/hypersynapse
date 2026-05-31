# hypersynapse — Dashboard

FastAPI + Tailwind/Alpine SPA. Shows the live state of the hypersynapse demo
team (agents, tasks, project status). Reads state from `state/*.json`; agents
can push status by either writing to `state/tasks.json` directly or POSTing to
`/api/tasks`.

## Layout

```
server.py              FastAPI app
requirements.txt
state/
    dashboard.json     global project state (paused, deadline, ...)
    agents.json        team roster (name, emoji, color, blurb)
    tasks.json         activity log (running/done/blocked)
static/
    index.html         SPA
    app.js
    style.css
systemd/
    hypersynapse-dashboard.service
install.sh             create venv, install deps
```

## Endpoints

| Method | Path                | Purpose                            |
|--------|---------------------|------------------------------------|
| GET    | `/`                 | SPA                                |
| GET    | `/api/snapshot`     | full state                         |
| POST   | `/api/pause`        | freeze the project                 |
| POST   | `/api/resume`       | unfreeze                           |
| POST   | `/api/tasks`        | upsert a task (agents publish)     |
| DELETE | `/api/tasks/{id}`   | remove a task                      |
| WS     | `/ws`               | live snapshot broadcast every 1.5s |

### Agent task payload

```json
{
  "id": "t-shader-act1",
  "agent": "shader_specialist",
  "title": "Act I — synapse fragment shader",
  "detail": "ray-marched SDF lattice, color-graded mauve",
  "status": "running",
  "progress": 0.35,
  "eta_sec": 1800
}
```

Status values: `running`, `done`, `blocked`.

## Run

```bash
./install.sh
./.venv/bin/uvicorn server:app --host 0.0.0.0 --port 8088
```

→ open `http://192.168.0.14:8088/` from any device in the LAN.

## Systemd

```bash
./install.sh
sudo cp systemd/hypersynapse-dashboard.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now hypersynapse-dashboard
journalctl -u hypersynapse-dashboard -f
```
