export default function StatusCard({ state, wsStatus }) {
  if (!state) {
    return <div className="card animate-pulse text-slate-500">Loading state…</div>;
  }
  const dotColor =
    wsStatus === "connected"
      ? "bg-green-400"
      : wsStatus === "error"
        ? "bg-red-400"
        : "bg-amber-400";
  return (
    <div className="card glow-purple">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold tracking-tight text-accent-glow">
            {state.project}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Phase{" "}
            <span className="text-slate-200">
              {state.phase} — {state.phaseName}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="badge bg-slate-800 text-slate-300">
            <span className={`h-2 w-2 rounded-full ${dotColor}`} />
            {wsStatus}
          </span>
          {state.hold ? (
            <span className="badge bg-amber-500/20 text-amber-300">⏸ ON HOLD</span>
          ) : (
            <span className="badge bg-green-500/20 text-green-300">▶ ACTIVE</span>
          )}
        </div>
      </div>
      {state.hold && state.holdReason && (
        <p className="mt-2 text-xs text-amber-300/80">
          Reason: {state.holdReason}
        </p>
      )}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <ProgressBar label="Phase progress" value={state.phaseProgress} />
        <ProgressBar label="Overall" value={state.overallProgress} />
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Updated: {new Date(state.lastUpdate).toLocaleTimeString()}
      </p>
    </div>
  );
}

function ProgressBar({ label, value }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-400">
        <span>{label}</span>
        <span className="font-mono text-slate-200">{pct}%</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-accent-glow transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
