import { useEffect, useState } from "react";
import { api } from "./lib/api.js";
import { connectWS } from "./lib/ws.js";
import StatusCard from "./components/StatusCard.jsx";
import ActivityFeed from "./components/ActivityFeed.jsx";
import AgentTree from "./components/AgentTree.jsx";
import TokenChart from "./components/TokenChart.jsx";
import ControlPanel from "./components/ControlPanel.jsx";

export default function App() {
  const [state, setState] = useState(null);
  const [activities, setActivities] = useState([]);
  const [agents, setAgents] = useState(null);
  const [tokens, setTokens] = useState(null);
  const [wsStatus, setWsStatus] = useState("connecting");

  async function refresh() {
    try {
      const [s, a, ag, t] = await Promise.all([
        api.status(),
        api.activities(50),
        api.agents(),
        api.tokens(),
      ]);
      setState(s);
      setActivities(a.activities ?? []);
      setAgents(ag);
      setTokens(t);
    } catch (e) {
      console.error("refresh failed", e);
    }
  }

  useEffect(() => {
    refresh();
    const disconnect = connectWS(
      (msg) => {
        if (msg.event === "activity_new") {
          setActivities((prev) => [msg.data, ...prev].slice(0, 100));
        } else if (msg.event === "state_change") {
          setState(msg.data);
        } else if (msg.event === "tokens_update") {
          setTokens(msg.data);
        } else if (msg.event === "agents_update") {
          setAgents(msg.data);
        }
      },
      (status) => setWsStatus(status),
    );
    return disconnect;
  }, []);

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <StatusCard state={state} wsStatus={wsStatus} />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="grid h-full gap-4 md:grid-rows-[1fr_auto]">
              <ActivityFeed activities={activities} />
            </div>
          </div>
          <div className="space-y-4">
            <ControlPanel state={state} onStateChange={setState} />
            <TokenChart tokens={tokens} />
            <AgentTree agents={agents} />
          </div>
        </div>
        <footer className="pt-4 text-center text-xs text-slate-600">
          HYPERSYNAPSE Dashboard · Phase A.1 MVP
        </footer>
      </div>
    </div>
  );
}
