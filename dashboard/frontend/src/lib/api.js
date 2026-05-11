const API = "/api";

async function jsonFetch(path, opts = {}) {
  const res = await fetch(API + path, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export const api = {
  status: () => jsonFetch("/status"),
  activities: (limit = 50) => jsonFetch(`/activities?limit=${limit}`),
  tokens: () => jsonFetch("/tokens"),
  agents: () => jsonFetch("/agents"),
  hold: (reason = "User-initiated hold") =>
    jsonFetch("/hold", { method: "POST", body: JSON.stringify({ reason }) }),
  resume: () => jsonFetch("/resume", { method: "POST" }),
};
