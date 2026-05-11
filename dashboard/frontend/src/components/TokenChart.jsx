import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TokenChart({ tokens }) {
  if (!tokens) return <div className="card animate-pulse text-slate-500">Loading…</div>;

  const data = (tokens.history ?? []).slice(-50).map((h) => ({
    time: formatTime(h.timestamp),
    total: h.total,
  }));

  const top = Object.entries(tokens.byAgent ?? {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="card">
      <div className="flex items-baseline justify-between">
        <h2 className="font-mono text-sm uppercase tracking-wider text-slate-400">
          Token Usage
        </h2>
        <span className="font-mono text-2xl font-bold text-accent-glow">
          {(tokens.total ?? 0).toLocaleString()}
        </span>
      </div>
      <div className="mt-3 h-32">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="time"
              tick={{ fill: "#64748b", fontSize: 10 }}
              stroke="#334155"
            />
            <YAxis
              tick={{ fill: "#64748b", fontSize: 10 }}
              stroke="#334155"
              width={40}
            />
            <Tooltip
              contentStyle={{
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: 6,
                fontSize: 12,
              }}
              labelStyle={{ color: "#94a3b8" }}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#a855f7"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {top.length > 0 && (
        <div className="mt-3 space-y-1">
          <p className="text-xs uppercase tracking-wider text-slate-500">Top agents</p>
          {top.map(([agent, count]) => (
            <div key={agent} className="flex items-center justify-between text-sm">
              <span className="truncate text-slate-300">{agent}</span>
              <span className="font-mono text-slate-400">{count.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
