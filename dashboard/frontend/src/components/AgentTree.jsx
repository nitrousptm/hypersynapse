function buildTree(agents) {
  const byName = new Map();
  for (const a of agents) byName.set(a.name, { ...a, children: [] });
  const roots = [];
  for (const a of byName.values()) {
    if (a.parent && byName.has(a.parent)) {
      byName.get(a.parent).children.push(a);
    } else {
      roots.push(a);
    }
  }
  return roots;
}

const STATUS_DOT = {
  active: "bg-green-400 animate-pulse",
  idle: "bg-slate-600",
  paused: "bg-amber-400",
  error: "bg-red-400",
};

const ROLE_BG = {
  Orchestrator: "bg-rose-500/15 border-rose-500/30",
  Manager: "bg-cyan-500/15 border-cyan-500/30",
  Specialist: "bg-emerald-500/15 border-emerald-500/30",
};

function AgentNode({ node, depth = 0 }) {
  return (
    <div>
      <div
        className={`mt-1 rounded-lg border px-3 py-2 ${ROLE_BG[node.role] ?? "bg-slate-800/50 border-slate-700"}`}
        style={{ marginLeft: `${depth * 16}px` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${STATUS_DOT[node.status] ?? "bg-slate-500"}`}
            />
            <span className="font-mono text-sm font-semibold text-slate-100">
              {node.name}
            </span>
            <span className="text-xs text-slate-500">{node.role}</span>
          </div>
        </div>
        {node.currentTask && (
          <p className="mt-1 truncate text-xs text-slate-400">{node.currentTask}</p>
        )}
      </div>
      {node.children?.map((child) => (
        <AgentNode key={child.name} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function AgentTree({ agents }) {
  const tree = buildTree(agents?.hierarchy ?? []);
  return (
    <div className="card">
      <h2 className="mb-3 font-mono text-sm uppercase tracking-wider text-slate-400">
        Agent Hierarchy
      </h2>
      {tree.length === 0 ? (
        <p className="text-sm text-slate-500">No agents registered.</p>
      ) : (
        <div className="space-y-1">
          {tree.map((root) => (
            <AgentNode key={root.name} node={root} />
          ))}
        </div>
      )}
    </div>
  );
}
