"""hypersynapse — Agentix project dashboard.

Single-process FastAPI app that:
- Exposes JSON state to the SPA at /static/
- Streams live updates over WebSocket /ws
- Lets the user pause/resume the whole project (state/dashboard.json -> paused)
- Lets agents push status by writing into state/tasks.json or via POST /api/tasks

Layout (relative to this file):
    server.py
    state/
        dashboard.json   global state (paused, project, started_at)
        agents.json      static-ish snapshot of agent definitions
        tasks.json       array of activity entries (mutated by agents)
    static/
        index.html, app.js, style.css

Run as:
    uvicorn server:app --host 0.0.0.0 --port 8088 --reload
"""
from __future__ import annotations

import asyncio
import json
import time
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

ROOT = Path(__file__).resolve().parent
STATE = ROOT / "state"
STATIC = ROOT / "static"

DASHBOARD_FILE = STATE / "dashboard.json"
AGENTS_FILE = STATE / "agents.json"
TASKS_FILE = STATE / "tasks.json"

POLL_INTERVAL_SEC = 0.3  # Fast updates for real-time feel


def _read_json(p: Path, default: Any) -> Any:
    try:
        return json.loads(p.read_text())
    except FileNotFoundError:
        return default
    except json.JSONDecodeError as e:
        print(f"[dashboard] WARN: {p.name} invalid JSON: {e}")
        return default


def _write_json(p: Path, data: Any) -> None:
    tmp = p.with_suffix(p.suffix + ".tmp")
    tmp.write_text(json.dumps(data, indent=2, ensure_ascii=False))
    tmp.replace(p)


# --- WebSocket fan-out -------------------------------------------------------

class Hub:
    def __init__(self) -> None:
        self.clients: set[WebSocket] = set()
        self.last_snapshot_sig: str = ""

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        self.clients.add(ws)

    def disconnect(self, ws: WebSocket) -> None:
        self.clients.discard(ws)

    async def broadcast(self, payload: dict) -> None:
        if not self.clients:
            return
        dead: list[WebSocket] = []
        for ws in self.clients:
            try:
                await ws.send_json(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.clients.discard(ws)


hub = Hub()


def snapshot() -> dict:
    return {
        "dashboard": _read_json(DASHBOARD_FILE, {}),
        "agents": _read_json(AGENTS_FILE, []),
        "tasks": _read_json(TASKS_FILE, []),
        "ts": time.time(),
    }


def snapshot_sig(snap: dict) -> str:
    # Hash a stable JSON dump; small enough that string compare is fine.
    return json.dumps(
        {k: snap[k] for k in ("dashboard", "agents", "tasks")},
        sort_keys=True,
    )


async def file_watcher() -> None:
    while True:
        try:
            snap = snapshot()
            sig = snapshot_sig(snap)
            if sig != hub.last_snapshot_sig:
                hub.last_snapshot_sig = sig
                await hub.broadcast({"type": "snapshot", "data": snap})
        except Exception as e:
            print(f"[dashboard] watcher error: {e}")
        await asyncio.sleep(POLL_INTERVAL_SEC)


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(file_watcher())
    yield
    task.cancel()


app = FastAPI(title="hypersynapse dashboard", lifespan=lifespan)


# --- API ---------------------------------------------------------------------

@app.get("/api/snapshot")
def api_snapshot():
    return JSONResponse(snapshot())


@app.post("/api/pause")
def api_pause():
    state = _read_json(DASHBOARD_FILE, {})
    state["paused"] = True
    state["paused_at"] = time.time()
    _write_json(DASHBOARD_FILE, state)
    return {"ok": True, "paused": True}


@app.post("/api/resume")
def api_resume():
    state = _read_json(DASHBOARD_FILE, {})
    state["paused"] = False
    state.pop("paused_at", None)
    _write_json(DASHBOARD_FILE, state)
    return {"ok": True, "paused": False}


@app.post("/api/tasks")
async def api_post_task(payload: dict):
    """Agents call this to publish their status.

    Required: agent, status (pending|running|done|blocked), title
    Optional: detail, progress [0..1], step (current work description), eta_sec

    Progress semantics:
    - pending: always 0
    - running: [0, 1] = estimated completion (0=just started, 1=nearly done)
    - done: always 1
    - blocked: frozen at last value

    Step: human-readable current subtask (e.g. "Writing SDF header", "Compiling shaders")
    """
    required = {"agent", "status", "title"}
    missing = required - payload.keys()
    if missing:
        raise HTTPException(400, f"missing fields: {sorted(missing)}")

    # Enforce progress semantics
    if payload["status"] == "done":
        payload["progress"] = 1.0
    elif payload["status"] == "pending":
        payload["progress"] = 0.0
    else:
        # running / blocked: use provided progress or default
        progress = payload.get("progress", 0.0)
        payload["progress"] = max(0.0, min(1.0, progress))

    tasks = _read_json(TASKS_FILE, [])
    payload.setdefault("id", f"t-{int(time.time()*1000)}")
    payload.setdefault("started_at", time.time())
    payload["updated_at"] = time.time()

    # Upsert by id.
    for i, t in enumerate(tasks):
        if t.get("id") == payload["id"]:
            tasks[i] = {**t, **payload}
            break
    else:
        tasks.append(payload)

    _write_json(TASKS_FILE, tasks)
    return {"ok": True, "id": payload["id"]}


@app.delete("/api/tasks/{task_id}")
def api_delete_task(task_id: str):
    tasks = _read_json(TASKS_FILE, [])
    tasks = [t for t in tasks if t.get("id") != task_id]
    _write_json(TASKS_FILE, tasks)
    return {"ok": True}


# --- WebSocket ---------------------------------------------------------------

@app.websocket("/ws")
async def ws(ws: WebSocket):
    await hub.connect(ws)
    try:
        # Push initial snapshot immediately.
        await ws.send_json({"type": "snapshot", "data": snapshot()})
        while True:
            # Keep-alive; we don't expect client → server messages, but receive
            # to detect disconnect promptly.
            await ws.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        hub.disconnect(ws)


# --- Static SPA --------------------------------------------------------------

app.mount("/static", StaticFiles(directory=str(STATIC)), name="static")


@app.get("/")
def root() -> FileResponse:
    return FileResponse(STATIC / "index.html")
