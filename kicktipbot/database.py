import sqlite3
import json
from datetime import datetime
from pathlib import Path

DB_PATH = Path("kicktipbot.db")

class TippsDatabase:
    def __init__(self):
        self.db_path = DB_PATH
        self.init_db()

    def init_db(self):
        """Initialisiert die Datenbank"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()

        # Tipps-Tabelle
        c.execute('''CREATE TABLE IF NOT EXISTS tipps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            match_id TEXT UNIQUE,
            team1 TEXT,
            team2 TEXT,
            tip TEXT,
            confidence REAL,
            odds_data TEXT,
            expert_data TEXT,
            placed_at TIMESTAMP,
            result TEXT,
            won BOOLEAN,
            notes TEXT
        )''')

        # Stats-Tabelle
        c.execute('''CREATE TABLE IF NOT EXISTS stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TIMESTAMP,
            total_tips INTEGER,
            correct_tips INTEGER,
            win_rate REAL,
            avg_confidence REAL
        )''')

        # Logs-Tabelle
        c.execute('''CREATE TABLE IF NOT EXISTS logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TIMESTAMP,
            level TEXT,
            message TEXT
        )''')

        conn.commit()
        conn.close()

    def save_tip(self, match_id, team1, team2, tip, confidence, odds_data, expert_data):
        """Speichert einen Tipp"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()

        try:
            c.execute('''INSERT INTO tipps
                (match_id, team1, team2, tip, confidence, odds_data, expert_data, placed_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
                (match_id, team1, team2, tip, confidence,
                 json.dumps(odds_data), json.dumps(expert_data), datetime.now()))

            conn.commit()
            return True
        except sqlite3.IntegrityError:
            return False
        finally:
            conn.close()

    def update_result(self, match_id, result, won):
        """Updated ein Match-Ergebnis"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()

        c.execute('''UPDATE tipps SET result=?, won=? WHERE match_id=?''',
                  (result, won, match_id))

        conn.commit()
        conn.close()

    def get_all_tipps(self, limit=50):
        """Holt alle Tipps"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()

        c.execute('''SELECT * FROM tipps ORDER BY placed_at DESC LIMIT ?''', (limit,))
        tipps = c.fetchall()

        conn.close()

        return [{
            "id": t[0],
            "match_id": t[1],
            "team1": t[2],
            "team2": t[3],
            "tip": t[4],
            "confidence": t[5],
            "placed_at": t[8],
            "result": t[9],
            "won": t[10]
        } for t in tipps]

    def get_stats(self):
        """Berechnet aktuelle Stats"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()

        c.execute('SELECT COUNT(*) FROM tipps WHERE result IS NOT NULL')
        total_with_result = c.fetchone()[0]

        if total_with_result == 0:
            conn.close()
            return {
                "total_tips": 0,
                "tips_with_result": 0,
                "correct_tips": 0,
                "win_rate": 0.0,
                "avg_confidence": 0.0
            }

        c.execute('SELECT COUNT(*) FROM tipps WHERE won=1')
        correct = c.fetchone()[0]

        c.execute('SELECT AVG(confidence) FROM tipps WHERE result IS NOT NULL')
        avg_conf = c.fetchone()[0] or 0.0

        c.execute('SELECT COUNT(*) FROM tipps')
        total = c.fetchone()[0]

        conn.close()

        return {
            "total_tips": total,
            "tips_with_result": total_with_result,
            "correct_tips": correct,
            "win_rate": (correct / total_with_result * 100) if total_with_result > 0 else 0.0,
            "avg_confidence": avg_conf
        }

    def log_event(self, level, message):
        """Logged ein Event"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()

        c.execute('INSERT INTO logs (timestamp, level, message) VALUES (?, ?, ?)',
                  (datetime.now(), level, message))

        conn.commit()
        conn.close()

    def get_logs(self, limit=100):
        """Holt die letzten Logs"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()

        c.execute('SELECT timestamp, level, message FROM logs ORDER BY timestamp DESC LIMIT ?',
                  (limit,))
        logs = c.fetchall()

        conn.close()

        return [{"timestamp": l[0], "level": l[1], "message": l[2]} for l in logs]
