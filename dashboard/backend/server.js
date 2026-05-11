import Fastify from "fastify";
import websocket from "@fastify/websocket";
import cors from "@fastify/cors";
import { readFile, writeFile, appendFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "state");
const STATE_FILE = join(STATE_DIR, "state.json");
const ACTIVITIES_FILE = join(STATE_DIR, "activities.jsonl");
const TOKENS_FILE = join(STATE_DIR, "tokens.json");
const AGENTS_FILE = join(STATE_DIR, "agents.json");

const PORT = Number(process.env.PORT ?? 8765);
const HOST = process.env.HOST ?? "127.0.0.1";

const DEFAULT_STATE = {
  project: "HYPERSYNAPSE",
  phase: "A.1",
  phaseName: "Dashboard MVP",
  phaseProgress: 0,
  overallProgress: 0,
  hold: false,
  holdReason: null,
  startedAt: new Date().toISOString(),
  lastUpdate: new Date().toISOString(),
};

const DEFAULT_AGENTS = {
  hierarchy: [
    {
      name: "CEO",
      role: "Orchestrator",
      status: "active",
      currentTask: "Project orchestration",
    },
    {
      name: "Frontend Manager",
      role: "Manager",
      parent: "CEO",
      status: "active",
      currentTask: "Coordinating dashboard development",
    },
    {
      name: "UI Specialist",
      role: "Specialist",
      parent: "Frontend Manager",
      status: "idle",
      currentTask: null,
    },
    {
      name: "UX Specialist",
      role: "Specialist",
      parent: "Frontend Manager",
      status: "idle",
      currentTask: null,
    },
    {
      name: "Backend Specialist",
      role: "Specialist",
      parent: "Frontend Manager",
      status: "active",
      currentTask: "Building Fastify + WebSocket server",
    },
  ],
};

const DEFAULT_TOKENS = {
  total: 0,
  byAgent: {},
  history: [],
};

async function ensureStateFiles() {
  if (!existsSync(STATE_DIR)) {
    await mkdir(STATE_DIR, { recursive: true });
  }
  if (!existsSync(STATE_FILE)) {
    await writeFile(STATE_FILE, JSON.stringify(DEFAULT_STATE, null, 2));
  }
  if (!existsSync(ACTIVITIES_FILE)) {
    await writeFile(ACTIVITIES_FILE, "");
  }
  if (!existsSync(TOKENS_FILE)) {
    await writeFile(TOKENS_FILE, JSON.stringify(DEFAULT_TOKENS, null, 2));
  }
  if (!existsSync(AGENTS_FILE)) {
    await writeFile(AGENTS_FILE, JSON.stringify(DEFAULT_AGENTS, null, 2));
  }
}

async function readJson(path) {
  const content = await readFile(path, "utf-8");
  return JSON.parse(content);
}

async function writeJson(path, data) {
  await writeFile(path, JSON.stringify(data, null, 2));
}

async function readActivities(limit = 50) {
  const content = await readFile(ACTIVITIES_FILE, "utf-8");
  const lines = content.split("\n").filter(Boolean);
  return lines
    .slice(-limit)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .reverse();
}

const wsClients = new Set();

function broadcast(event, data) {
  const message = JSON.stringify({ event, data, timestamp: Date.now() });
  for (const client of wsClients) {
    try {
      if (client.readyState === 1) {
        client.send(message);
      }
    } catch (err) {
      // ignore broken clients
    }
  }
}

async function buildServer() {
  await ensureStateFiles();

  const app = Fastify({ logger: { level: "info" } });

  await app.register(cors, { origin: true });
  await app.register(websocket);

  app.get("/api/health", async () => ({ ok: true, ts: Date.now() }));

  app.get("/api/status", async () => {
    return await readJson(STATE_FILE);
  });

  app.get("/api/activities", async (req) => {
    const limit = Math.min(Number(req.query?.limit ?? 50), 500);
    return { activities: await readActivities(limit) };
  });

  app.get("/api/tokens", async () => {
    return await readJson(TOKENS_FILE);
  });

  app.get("/api/agents", async () => {
    return await readJson(AGENTS_FILE);
  });

  app.post("/api/hold", async (req) => {
    const state = await readJson(STATE_FILE);
    state.hold = true;
    state.holdReason = req.body?.reason ?? "User-initiated hold";
    state.lastUpdate = new Date().toISOString();
    await writeJson(STATE_FILE, state);
    broadcast("state_change", state);
    return { ok: true, state };
  });

  app.post("/api/resume", async () => {
    const state = await readJson(STATE_FILE);
    state.hold = false;
    state.holdReason = null;
    state.lastUpdate = new Date().toISOString();
    await writeJson(STATE_FILE, state);
    broadcast("state_change", state);
    return { ok: true, state };
  });

  app.post("/api/activity", async (req) => {
    const activity = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      agent: req.body?.agent ?? "Unknown",
      action: req.body?.action ?? "",
      detail: req.body?.detail ?? "",
      duration_ms: req.body?.duration_ms ?? null,
      status: req.body?.status ?? "in_progress",
    };
    await appendFile(ACTIVITIES_FILE, JSON.stringify(activity) + "\n");
    broadcast("activity_new", activity);
    return { ok: true, activity };
  });

  app.post("/api/tokens/add", async (req) => {
    const tokens = await readJson(TOKENS_FILE);
    const agent = req.body?.agent ?? "Unknown";
    const count = Number(req.body?.count ?? 0);
    tokens.total += count;
    tokens.byAgent[agent] = (tokens.byAgent[agent] ?? 0) + count;
    tokens.history.push({
      timestamp: new Date().toISOString(),
      agent,
      count,
      total: tokens.total,
    });
    if (tokens.history.length > 1000) {
      tokens.history = tokens.history.slice(-1000);
    }
    await writeJson(TOKENS_FILE, tokens);
    broadcast("tokens_update", tokens);
    return { ok: true, tokens };
  });

  app.post("/api/state", async (req) => {
    const state = await readJson(STATE_FILE);
    Object.assign(state, req.body ?? {});
    state.lastUpdate = new Date().toISOString();
    await writeJson(STATE_FILE, state);
    broadcast("state_change", state);
    return { ok: true, state };
  });

  app.post("/api/agents", async (req) => {
    const agents = req.body ?? { hierarchy: [] };
    await writeJson(AGENTS_FILE, agents);
    broadcast("agents_update", agents);
    return { ok: true, agents };
  });

  app.get("/ws", { websocket: true }, (socket) => {
    wsClients.add(socket);
    socket.send(
      JSON.stringify({ event: "hello", data: { ok: true, ts: Date.now() } }),
    );
    socket.on("close", () => wsClients.delete(socket));
    socket.on("error", () => wsClients.delete(socket));
  });

  return app;
}

const app = await buildServer();
try {
  await app.listen({ port: PORT, host: HOST });
  app.log.info(`HYPERSYNAPSE Dashboard Backend running on http://${HOST}:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
