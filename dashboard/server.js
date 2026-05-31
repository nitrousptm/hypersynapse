#!/usr/bin/env node
/**
 * HYPERSYNAPSE Dashboard Server
 * Pure Node.js — no npm packages required.
 *
 * Endpoints:
 *   GET  /              → index.html
 *   GET  /static/*      → static files
 *   GET  /api/snapshot  → JSON state
 *   POST /api/pause     → pause project
 *   POST /api/resume    → resume project
 *   POST /api/tasks     → upsert task (agent pushes status)
 *   DELETE /api/tasks/:id → remove task
 *   WS   /ws            → live updates (server-sent snapshots)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

const PORT = process.env.PORT || 8088;
const ROOT = __dirname;
const STATE = path.join(ROOT, 'state');
const STATIC = path.join(ROOT, 'static');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json',
  '.ico':  'image/x-icon',
  '.svg':  'image/svg+xml',
};

// ── State ────────────────────────────────────────────────────────────────────

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return fallback; }
}

function writeJson(file, data) {
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, file);
}

function snapshot() {
  return {
    dashboard: readJson(path.join(STATE, 'dashboard.json'), {}),
    agents:    readJson(path.join(STATE, 'agents.json'),    []),
    tasks:     readJson(path.join(STATE, 'tasks.json'),     []),
    ts: Date.now() / 1000,
  };
}

// ── WebSocket (manual upgrade) ────────────────────────────────────────────────

const bus = new EventEmitter();
const clients = new Set();

function wsHandshake(req, socket) {
  const key = req.headers['sec-websocket-key'];
  if (!key) { socket.destroy(); return; }
  const accept = require('crypto')
    .createHash('sha1')
    .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
    .digest('base64');
  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\nConnection: Upgrade\r\n' +
    `Sec-WebSocket-Accept: ${accept}\r\n\r\n`
  );
  return socket;
}

function wsSend(socket, payload) {
  const data = Buffer.from(JSON.stringify(payload));
  const len = data.length;
  let header;
  if (len < 126) {
    header = Buffer.from([0x81, len]);
  } else if (len < 65536) {
    header = Buffer.from([0x81, 126, (len >> 8) & 0xff, len & 0xff]);
  } else {
    header = Buffer.from([0x81, 127, 0,0,0,0, (len>>24)&0xff,(len>>16)&0xff,(len>>8)&0xff,len&0xff]);
  }
  try { socket.write(Buffer.concat([header, data])); } catch {}
}

function broadcast(payload) {
  for (const s of clients) {
    wsSend(s, payload);
  }
}

// Poll state files every 2s and broadcast if changed.
let lastSig = '';
setInterval(() => {
  const snap = snapshot();
  const sig = JSON.stringify({ d: snap.dashboard, a: snap.agents, t: snap.tasks });
  if (sig !== lastSig) {
    lastSig = sig;
    broadcast({ type: 'snapshot', data: snap });
  }
}, 2000);

// ── HTTP ─────────────────────────────────────────────────────────────────────

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); }
      catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

function serveFile(res, filePath) {
  const ext = path.extname(filePath);
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not Found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

function json(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost`);
  const { pathname } = url;
  const method = req.method;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // Static
  if (pathname === '/' || pathname === '/index.html') {
    return serveFile(res, path.join(STATIC, 'index.html'));
  }
  if (pathname.startsWith('/static/')) {
    const rel = pathname.slice('/static/'.length);
    return serveFile(res, path.join(STATIC, rel));
  }

  // API
  if (pathname === '/api/snapshot' && method === 'GET') {
    return json(res, 200, snapshot());
  }
  if (pathname === '/api/pause' && method === 'POST') {
    const state = readJson(path.join(STATE, 'dashboard.json'), {});
    state.paused = true; state.paused_at = Date.now() / 1000;
    writeJson(path.join(STATE, 'dashboard.json'), state);
    return json(res, 200, { ok: true, paused: true });
  }
  if (pathname === '/api/resume' && method === 'POST') {
    const state = readJson(path.join(STATE, 'dashboard.json'), {});
    state.paused = false; delete state.paused_at;
    writeJson(path.join(STATE, 'dashboard.json'), state);
    return json(res, 200, { ok: true, paused: false });
  }
  if (pathname === '/api/tasks' && method === 'POST') {
    const body = await readBody(req);
    if (!body.agent || !body.status || !body.title) {
      return json(res, 400, { error: 'missing: agent, status, title' });
    }
    const tasks = readJson(path.join(STATE, 'tasks.json'), []);
    body.id = body.id || `t-${Date.now()}`;
    body.started_at = body.started_at || (Date.now() / 1000);
    body.updated_at = Date.now() / 1000;
    const idx = tasks.findIndex(t => t.id === body.id);
    if (idx >= 0) tasks[idx] = { ...tasks[idx], ...body, updated_at: Date.now() / 1000 };
    else tasks.push(body);
    writeJson(path.join(STATE, 'tasks.json'), tasks);
    return json(res, 200, { ok: true, id: body.id });
  }
  if (pathname.startsWith('/api/tasks/') && method === 'DELETE') {
    const id = pathname.slice('/api/tasks/'.length);
    let tasks = readJson(path.join(STATE, 'tasks.json'), []);
    tasks = tasks.filter(t => t.id !== id);
    writeJson(path.join(STATE, 'tasks.json'), tasks);
    return json(res, 200, { ok: true });
  }

  res.writeHead(404); res.end('Not Found');
});

// WebSocket upgrade
server.on('upgrade', (req, socket) => {
  if (req.url === '/ws') {
    wsHandshake(req, socket);
    clients.add(socket);
    // Send initial snapshot
    wsSend(socket, { type: 'snapshot', data: snapshot() });
    socket.on('close', () => clients.delete(socket));
    socket.on('error', () => clients.delete(socket));
    socket.on('data', () => {}); // consume ping frames
  } else {
    socket.destroy();
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[hypersynapse-dashboard] http://0.0.0.0:${PORT}`);
});
