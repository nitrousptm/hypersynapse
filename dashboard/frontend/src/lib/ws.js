export function connectWS(onMessage, onStatus) {
  const proto = location.protocol === "https:" ? "wss:" : "ws:";
  const url = `${proto}//${location.host}/ws`;
  let ws = null;
  let reconnectTimer = null;
  let stopped = false;

  function connect() {
    ws = new WebSocket(url);
    ws.onopen = () => onStatus?.("connected");
    ws.onclose = () => {
      onStatus?.("disconnected");
      if (!stopped) {
        reconnectTimer = setTimeout(connect, 2000);
      }
    };
    ws.onerror = () => onStatus?.("error");
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        onMessage(msg);
      } catch {
        // ignore malformed messages
      }
    };
  }

  connect();

  return () => {
    stopped = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    ws?.close();
  };
}
