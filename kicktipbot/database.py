"""
SQLite-Datenbank für kicktipbot.
Speichert Tipps (mit Scores), Stats, Logs.
"""

import sqlite3
import json
from datetime import datetime
from pathlib import Path

DB_PATH = Path(__file__).parent / "kicktipbot.db"


class TippsDatabase:
    def __init__(self):
        self.db_path = DB_PATH
        self.init_db()

    def init_db(self):
        """Initialisiert die Datenbank"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()

        c.execute('''CREATE TABLE IF NOT EXISTS tipps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            match_id TEXT UNIQUE,
            team1 TEXT NOT NULL,
            team2 TEXT NOT NULL,
            home_goals INTEGER NOT NULL,
            away_goals INTEGER NOT NULL,
            expected_points REAL,
            confidence REAL,
            lambda_home REAL,
            lambda_away REAL,
            odds_data TEXT,
            expert_data TEXT,
            form_data TEXT,
            alternatives TEXT,
            placed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            actual_home INTEGER,
            actual_away INTEGER,
            points_won INTEGER,
            notes TEXT
        )''')

        c.execute('''CREATE TABLE IF NOT EXISTS stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            total_tips INTEGER,
            tendency_correct INTEGER,
            difference_correct INTEGER,
            exact_correct INTEGER,
            total_points INTEGER,
            avg_confidence REAL
        )''')

        c.execute('''CREATE TABLE IF NOT EXISTS logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            level TEXT,
            message TEXT
        )''')

        c.execute('CREATE INDEX IF NOT EXISTS idx_tipps_match ON tipps(match_id)')
        c.execute('CREATE INDEX IF NOT EXISTS idx_tipps_placed ON tipps(placed_at)')
        c.execute('CREATE INDEX IF NOT EXISTS idx_logs_time ON logs(timestamp)')

        conn.commit()
        conn.close()

    def save_tip(self, match_id, team1, team2, tip_result, odds_data, expert_data, form_data=None):
        """Speichert einen Tipp mit allen Details"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()

        try:
            home_goals, away_goals = tip_result["score"]

            c.execute('''INSERT OR REPLACE INTO tipps
                (match_id, team1, team2, home_goals, away_goals,
                 expected_points, confidence, lambda_home, lambda_away,
                 odds_data, expert_data, form_data, alternatives, placed_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                (match_id, team1, team2, home_goals, away_goals,
                 tip_result.get("expected_points", 0),
                 tip_result.get("confidence", 0),
                 tip_result.get("lambda_home", 0),
                 tip_result.get("lambda_away", 0),
                 json.dumps(odds_data),
                 json.dumps(expert_data),
                 json.dumps(form_data) if form_data else None,
                 json.dumps(tip_result.get("top_3_alternatives", [])),
                 datetime.now()))

            conn.commit()
            return True
        except Exception as e:
            print(f"[DB] Error saving tip: {e}")
            return False
        finally:
            conn.close()

    def update_result(self, match_id, actual_home, actual_away):
        """Updated Match-Ergebnis und berechnet Punkte"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()

        c.execute('SELECT home_goals, away_goals FROM tipps WHERE match_id=?', (match_id,))
        row = c.fetchone()
        if not row:
            conn.close()
            return False

        tip_home, tip_away = row
        points = self._calculate_points(tip_home, tip_away, actual_home, actual_away)

        c.execute('''UPDATE tipps SET actual_home=?, actual_away=?, points_won=?
                     WHERE match_id=?''',
                  (actual_home, actual_away, points, match_id))

        conn.commit()
        conn.close()
        return True

    def _calculate_points(self, tip_h, tip_a, act_h, act_a):
        """Berechnet erzielte Punkte nach Kicktipp-Regeln"""
        if tip_h == act_h and tip_a == act_a:
            return 4  # Exakt
        if (tip_h - tip_a) == (act_h - act_a):
            return 3  # Tor-Differenz
        tip_tend = 1 if tip_h > tip_a else (0 if tip_h == tip_a else 2)
        act_tend = 1 if act_h > act_a else (0 if act_h == act_a else 2)
        if tip_tend == act_tend:
            return 2  # Tendenz
        return 0

    def get_all_tipps(self, limit=50):
        """Holt alle Tipps mit allen Details"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()

        c.execute('SELECT * FROM tipps ORDER BY placed_at DESC LIMIT ?', (limit,))
        rows = c.fetchall()
        conn.close()

        result = []
        for r in rows:
            d = dict(r)
            d["tip_str"] = f"{d['home_goals']}:{d['away_goals']}"
            if d.get("actual_home") is not None:
                d["actual_str"] = f"{d['actual_home']}:{d['actual_away']}"
            else:
                d["actual_str"] = None
            result.append(d)

        return result

    def get_stats(self):
        """Berechnet Stats nach Kicktipp-Regeln"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()

        c.execute('SELECT COUNT(*) FROM tipps')
        total = c.fetchone()[0]

        c.execute('SELECT COUNT(*) FROM tipps WHERE actual_home IS NOT NULL')
        with_result = c.fetchone()[0]

        if with_result == 0:
            c.execute('SELECT AVG(confidence) FROM tipps')
            avg_conf = c.fetchone()[0] or 0.0

            c.execute('SELECT AVG(expected_points) FROM tipps')
            avg_ep = c.fetchone()[0] or 0.0

            conn.close()
            return {
                "total_tips": total,
                "tips_with_result": 0,
                "tendency_correct": 0,
                "difference_correct": 0,
                "exact_correct": 0,
                "total_points": 0,
                "avg_points_per_match": 0,
                "avg_confidence": round(avg_conf, 3),
                "avg_expected_points": round(avg_ep, 3)
            }

        c.execute('SELECT COUNT(*) FROM tipps WHERE points_won = 2')
        tend_only = c.fetchone()[0]
        c.execute('SELECT COUNT(*) FROM tipps WHERE points_won = 3')
        diff = c.fetchone()[0]
        c.execute('SELECT COUNT(*) FROM tipps WHERE points_won = 4')
        exact = c.fetchone()[0]

        c.execute('SELECT SUM(points_won) FROM tipps WHERE points_won IS NOT NULL')
        total_pts = c.fetchone()[0] or 0

        c.execute('SELECT AVG(confidence) FROM tipps')
        avg_conf = c.fetchone()[0] or 0.0

        c.execute('SELECT AVG(expected_points) FROM tipps')
        avg_ep = c.fetchone()[0] or 0.0

        conn.close()

        return {
            "total_tips": total,
            "tips_with_result": with_result,
            "tendency_correct": tend_only + diff + exact,  # alle die Tendenz hatten
            "difference_correct": diff + exact,
            "exact_correct": exact,
            "total_points": total_pts,
            "avg_points_per_match": round(total_pts / with_result, 2) if with_result > 0 else 0,
            "avg_confidence": round(avg_conf, 3),
            "avg_expected_points": round(avg_ep, 3)
        }

    def get_tip(self, match_id):
        """Holt einen gespeicherten Tipp anhand der match_id"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute('SELECT * FROM tipps WHERE match_id=? ORDER BY placed_at DESC LIMIT 1', (match_id,))
        row = c.fetchone()
        conn.close()
        return dict(row) if row else None

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
        rows = c.fetchall()
        conn.close()
        return [{"timestamp": r[0], "level": r[1], "message": r[2]} for r in rows]
