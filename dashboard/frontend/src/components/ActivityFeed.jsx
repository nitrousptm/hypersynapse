const STATUS_COLORS = {
  in_progress: "bg-blue-500/20 text-blue-300",
  done: "bg-green-500/20 text-green-300",
  error: "bg-red-500/20 text-red-300",
  paused: "bg-amber-500/20 text-amber-300",
};

export default function ActivityFeed({ activities }) {
  return (
    <div className="card flex h-full flex-col">
      <h2 className="mb-3 flex items-center justify-between font-mono text-sm uppercase tracking-wider text-slate-400">
        <span>Live Activity</span>
        <span className="text-xs text-slate-500">{activities.length} events</span>
      </h2>
      <div className="flex-1 overflow-y-auto pr-1">
        {activities.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            Waiting for activity…
          </p>
        ) : (
          <ul className="space-y-2">
            {activities.map((a) => (
              <li
                key={a.id}
                className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-3 transition hover:border-accent/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-sm font-semibold text-accent-glow">
                      {a.agent}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-200">{a.action}</p>
                    {a.detail && (
                      <p className="mt-0.5 text-xs text-slate-400">{a.detail}</p>
                    )}
                  </div>
                  <span
                    className={`badge whitespace-nowrap ${STATUS_COLORS[a.status] ?? "bg-slate-700 text-slate-300"}`}
                  >
                    {a.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {new Date(a.timestamp).toLocaleTimeString()}
                  {a.duration_ms != null && ` · ${(a.duration_ms / 1000).toFixed(1)}s`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
