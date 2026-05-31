function dashboard() {
  return {
    connected: false,
    ws: null,
    dash: {},
    agents: [],
    tasks: [],
    columns: [
      { key: 'running', label: 'In Progress', color: 'text-neon-cyan' },
      { key: 'done',    label: 'Done',        color: 'text-neon-lime' },
      { key: 'blocked', label: 'Blocked',     color: 'text-red-400' },
    ],

    // ── Computed ─────────────────────────────────────────────────────────

    get daysLeft() {
      if (!this.dash.deadline) return '–';
      const ms = new Date(this.dash.deadline) - Date.now();
      return Math.max(0, Math.ceil(ms / 86400000));
    },

    get runningCount() {
      const names = new Set(this.tasks.filter(t => t.status === 'running').map(t => t.agent));
      return names.size;
    },

    get doneCount() {
      return this.tasks.filter(t => t.status === 'done').length;
    },

    get overallProgress() {
      if (!this.tasks.length) return 0;
      const total = this.tasks.reduce((s, t) => s + (t.progress || (t.status === 'done' ? 1 : 0)), 0);
      return Math.round((total / this.tasks.length) * 100);
    },

    get doneTasks() {
      return this.tasks
        .filter(t => t.status === 'done')
        .sort((a, b) => (b.finished_at || b.started_at || 0) - (a.finished_at || a.started_at || 0));
    },

    // ── Agent helpers ─────────────────────────────────────────────────────

    agentRunning(name) {
      return this.tasks.some(t => t.agent === name && t.status === 'running');
    },
    agentDone(name) {
      return this.tasks.some(t => t.agent === name && t.status === 'done') &&
             !this.agentRunning(name);
    },
    agentDoneCount(name) {
      return this.tasks.filter(t => t.agent === name && t.status === 'done').length;
    },
    agentActiveTasks(name) {
      return this.tasks
        .filter(t => t.agent === name && t.status !== 'done')
        .sort((a, b) => (b.started_at || 0) - (a.started_at || 0))
        .slice(0, 1);
    },
    agentEmoji(name) {
      const a = this.agents.find(x => x.name === name);
      return a ? a.emoji : '·';
    },

    // ── Task helpers ──────────────────────────────────────────────────────

    tasksIn(status) {
      return this.tasks
        .filter(t => t.status === status)
        .sort((a, b) => (b.started_at || 0) - (a.started_at || 0));
    },

    // ── Formatting ────────────────────────────────────────────────────────

    fmtDate(ts) {
      if (!ts) return '';
      const d = new Date(ts * 1000);
      return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) +
             ' ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    },

    fmtElapsed(t) {
      const end = t.finished_at || (Date.now() / 1000);
      const start = t.started_at;
      if (!start) return '';
      const sec = Math.max(0, end - start);
      if (sec < 60)   return `${Math.round(sec)}s`;
      if (sec < 3600) return `${Math.round(sec / 60)}m`;
      return `${(sec / 3600).toFixed(1)}h`;
    },

    // ── State sync ────────────────────────────────────────────────────────

    apply(snap) {
      this.dash   = snap.dashboard || {};
      this.agents = snap.agents    || [];
      this.tasks  = snap.tasks     || [];
    },

    connect() {
      const proto = location.protocol === 'https:' ? 'wss' : 'ws';
      const url = `${proto}://${location.host}/ws`;
      const tryConnect = () => {
        this.ws = new WebSocket(url);
        this.ws.onopen  = () => { this.connected = true; };
        this.ws.onclose = () => {
          this.connected = false;
          setTimeout(tryConnect, 3000);
        };
        this.ws.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data);
            if (msg.type === 'snapshot') this.apply(msg.data);
          } catch {}
        };
      };
      tryConnect();
      // Initial fetch in case WS races.
      fetch('/api/snapshot').then(r => r.json()).then(s => this.apply(s)).catch(() => {});
    },

    async togglePause() {
      const url = this.dash.paused ? '/api/resume' : '/api/pause';
      await fetch(url, { method: 'POST' });
    },
  };
}
