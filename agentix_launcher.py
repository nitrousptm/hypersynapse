#!/usr/bin/env python3
"""
AGENTIX - Assembly 2026 Demo Launcher
Standalone executable for Windows (created with PyInstaller)

This launcher starts the premium 3D WebGL visualization
or opens the native C++ version if available.
"""

import sys
import os
import webbrowser
import threading
import time
from pathlib import Path

# ============================================================================
# Configuration
# ============================================================================

APP_NAME = "AGENTIX"
VERSION = "1.0"
DEMO_URL = "http://localhost:8080/advanced.html"
DEMO_PORT = 8080

# ============================================================================
# Web Server
# ============================================================================

def start_web_server():
    """Start a simple HTTP server for the demo"""
    try:
        from http.server import HTTPServer, SimpleHTTPRequestHandler

        class DemoHandler(SimpleHTTPRequestHandler):
            def log_message(self, format, *args):
                pass  # Suppress logging

        # Get the directory with the HTML files
        demo_dir = Path(__file__).parent / "agentix_demo"
        if not demo_dir.exists():
            demo_dir = Path(__file__).parent

        os.chdir(str(demo_dir))

        server = HTTPServer(("localhost", DEMO_PORT), DemoHandler)
        server.timeout = 1.0

        while True:
            server.handle_request()

    except Exception as e:
        print(f"Server error: {e}")

# ============================================================================
# GUI
# ============================================================================

def create_gui():
    """Create a simple Tkinter GUI for the launcher"""
    try:
        import tkinter as tk
        from tkinter import ttk

        root = tk.Tk()
        root.title(f"{APP_NAME} Launcher v{VERSION}")
        root.geometry("600x400")
        root.configure(bg="#0a0e27")

        # Styling
        style = ttk.Style()
        style.theme_use('clam')

        # Header
        header = tk.Label(
            root,
            text="🤖 AGENTIX",
            font=("Helvetica", 24, "bold"),
            fg="#00ff88",
            bg="#0a0e27"
        )
        header.pack(pady=20)

        subtitle = tk.Label(
            root,
            text="Hierarchical Agent System Visualization",
            font=("Helvetica", 12),
            fg="#00ccff",
            bg="#0a0e27"
        )
        subtitle.pack()

        subtitle2 = tk.Label(
            root,
            text="Assembly 2026 Demo",
            font=("Helvetica", 10),
            fg="#ffaa00",
            bg="#0a0e27"
        )
        subtitle2.pack()

        # Separator
        sep = tk.Frame(root, bg="#444", height=2)
        sep.pack(fill=tk.X, pady=20)

        # Description
        desc = tk.Label(
            root,
            text=(
                "Real-time 3D visualization of the Agentix agent orchestration system.\n"
                "Watch as tasks flow through hierarchical agents with particle effects,\n"
                "smooth animations, and GPU-accelerated rendering."
            ),
            font=("Helvetica", 10),
            fg="#aaa",
            bg="#0a0e27",
            justify=tk.CENTER
        )
        desc.pack(pady=10)

        # Info box
        info_frame = tk.Frame(root, bg="#1a1a2e", relief=tk.SUNKEN, bd=1)
        info_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=10)

        info_text = tk.Label(
            info_frame,
            text=(
                "Features:\n"
                "• 12 hierarchical agent nodes\n"
                "• Particle effects system\n"
                "• Multi-light rendering\n"
                "• 11-step task flow animation\n"
                "• 60 FPS GPU-optimized\n"
                "• Interactive 3D camera"
            ),
            font=("Courier", 9),
            fg="#00ff88",
            bg="#1a1a2e",
            justify=tk.LEFT
        )
        info_text.pack(padx=10, pady=10, anchor=tk.W)

        # Buttons
        button_frame = tk.Frame(root, bg="#0a0e27")
        button_frame.pack(pady=20)

        launch_btn = tk.Button(
            button_frame,
            text="▶ Launch 3D Demo",
            font=("Helvetica", 12, "bold"),
            bg="#00ff88",
            fg="#000",
            padx=20,
            pady=10,
            command=lambda: launch_demo(root)
        )
        launch_btn.pack(side=tk.LEFT, padx=10)

        exit_btn = tk.Button(
            button_frame,
            text="✕ Exit",
            font=("Helvetica", 12),
            bg="#ff3366",
            fg="#fff",
            padx=20,
            pady=10,
            command=root.quit
        )
        exit_btn.pack(side=tk.LEFT, padx=10)

        # Footer
        footer = tk.Label(
            root,
            text="AGENTIX v1.0 | Assembly 2026 | Made with ❤️ by Xena",
            font=("Helvetica", 8),
            fg="#666",
            bg="#0a0e27"
        )
        footer.pack(side=tk.BOTTOM, pady=10)

        root.mainloop()

    except ImportError:
        print("Tkinter not available, launching demo directly...")
        launch_demo_direct()

def launch_demo(root=None):
    """Launch the 3D demo"""
    if root:
        root.withdraw()

    # Start web server in background
    server_thread = threading.Thread(target=start_web_server, daemon=True)
    server_thread.start()

    # Give server time to start
    time.sleep(1)

    # Open browser
    print(f"Opening {DEMO_URL}...")
    webbrowser.open(DEMO_URL)

    print("Demo started! Close this window to exit.")

    # Keep running
    if root:
        root.deiconify()
    else:
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\nExiting...")
            sys.exit(0)

def launch_demo_direct():
    """Launch demo without GUI"""
    launch_demo()

# ============================================================================
# Main
# ============================================================================

def main():
    print()
    print("╔════════════════════════════════════════════════════════════════╗")
    print("║                                                                ║")
    print("║                    🤖 AGENTIX Launcher                         ║")
    print("║                   Assembly 2026 Demo Edition                   ║")
    print("║                                                                ║")
    print("╚════════════════════════════════════════════════════════════════╝")
    print()
    print("Starting AGENTIX 3D visualization...")
    print()

    # Try GUI first, fall back to direct launch
    try:
        create_gui()
    except Exception as e:
        print(f"GUI error: {e}")
        print("Launching demo directly...")
        launch_demo_direct()

if __name__ == "__main__":
    main()
