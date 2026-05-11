import { useState } from "react";
import { api } from "../lib/api.js";

export default function ControlPanel({ state, onStateChange }) {
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");

  async function hold() {
    setBusy(true);
    try {
      const res = await api.hold(reason || "User-initiated hold (token saving)");
      onStateChange?.(res.state);
      setReason("");
    } finally {
      setBusy(false);
    }
  }

  async function resume() {
    setBusy(true);
    try {
      const res = await api.resume();
      onStateChange?.(res.state);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <h2 className="mb-3 font-mono text-sm uppercase tracking-wider text-slate-400">
        Control
      </h2>
      {state?.hold ? (
        <div className="space-y-3">
          <p className="text-sm text-amber-300">
            Development is paused — no tokens are being consumed.
          </p>
          <button
            type="button"
            onClick={resume}
            disabled={busy}
            className="w-full rounded-lg bg-green-500/20 px-4 py-2 font-medium text-green-300 transition hover:bg-green-500/30 disabled:opacity-50"
          >
            ▶ Resume Development
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional, e.g. 'token saving')"
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-accent focus:outline-none"
          />
          <button
            type="button"
            onClick={hold}
            disabled={busy}
            className="w-full rounded-lg bg-amber-500/20 px-4 py-2 font-medium text-amber-300 transition hover:bg-amber-500/30 disabled:opacity-50"
          >
            ⏸ Pause All Agents
          </button>
        </div>
      )}
    </div>
  );
}
