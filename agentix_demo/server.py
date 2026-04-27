#!/usr/bin/env python3
"""
Agentix Agent System — Demo Server
Starts a simple HTTP server and opens the demo in the browser.
"""

import os
import sys
import webbrowser
import threading
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

# Get the directory where this script is located
DEMO_DIR = Path(__file__).parent

class DemoHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DEMO_DIR), **kwargs)

    def log_message(self, format, *args):
        # Suppress logging
        pass


def start_server(port=8000):
    """Start HTTP server"""
    server = HTTPServer(('localhost', port), DemoHandler)
    print(f"🚀 Server running on http://localhost:{port}")
    server.serve_forever()


def main():
    port = 8000

    print()
    print("=" * 50)
    print("Agentix Agent System — Interactive Demo")
    print("=" * 50)
    print()
    print("📂 Demo directory:", DEMO_DIR)
    print()

    # Check if index.html exists
    if not (DEMO_DIR / "index.html").exists():
        print("❌ ERROR: index.html not found!")
        sys.exit(1)

    # Start server in background thread
    server_thread = threading.Thread(target=start_server, args=(port,), daemon=True)
    server_thread.start()

    # Give server a moment to start
    import time
    time.sleep(0.5)

    # Open browser
    url = f"http://localhost:{port}"
    print(f"🌐 Opening browser: {url}")
    print()

    webbrowser.open(url)

    print("✅ Demo started!")
    print("Press Ctrl+C to stop the server.")
    print()

    try:
        # Keep the server running
        server_thread.join()
    except KeyboardInterrupt:
        print("\n✋ Server stopped.")
        sys.exit(0)


if __name__ == "__main__":
    main()
