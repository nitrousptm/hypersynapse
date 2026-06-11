#!/usr/bin/env python3
"""
kicktipbot Dashboard - Web UI für Stats und Tipps-Historie
"""

from flask import Flask, render_template, jsonify
from database import TippsDatabase
import os

app = Flask(__name__, template_folder="templates", static_folder="static")
db = TippsDatabase()

@app.route("/")
def index():
    """Hauptseite - Dashboard"""
    stats = db.get_stats()
    recent_tipps = db.get_all_tipps(limit=20)
    logs = db.get_logs(limit=20)

    return render_template("index.html", stats=stats, tipps=recent_tipps, logs=logs)

@app.route("/api/stats")
def api_stats():
    """API-Endpoint für Stats"""
    stats = db.get_stats()
    return jsonify(stats)

@app.route("/api/tipps")
def api_tipps():
    """API-Endpoint für Tipps-Liste"""
    tipps = db.get_all_tipps(limit=50)
    return jsonify(tipps)

@app.route("/api/logs")
def api_logs():
    """API-Endpoint für Logs"""
    logs = db.get_logs(limit=100)
    return jsonify(logs)

@app.route("/api/health")
def api_health():
    """Health-Check"""
    return jsonify({
        "status": "ok",
        "version": "1.0.0",
        "database": "connected" if os.path.exists("kicktipbot.db") else "not_found"
    })

if __name__ == "__main__":
    print("🚀 Dashboard starting on http://0.0.0.0:5000")
    print("   Access from LAN: http://<your-ip>:5000")
    app.run(host="0.0.0.0", port=5000, debug=False)
