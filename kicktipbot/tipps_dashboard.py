#!/usr/bin/env python3
"""
tipps_dashboard.py - Dashboard für tägliche Tipps
Zeigt: aktuelle Tipps, Quellen-Zuverlässigkeit, historische Performance
"""

import json
import os
from datetime import datetime, timedelta
from pathlib import Path

class TippsDashboard:
    def __init__(self, tipps_dir="."):
        self.tipps_dir = tipps_dir

    def find_latest_tipps_file(self):
        """Findet die neueste tipps_YYYY-MM-DD.json"""
        files = sorted(Path(self.tipps_dir).glob("tipps_*.json"), reverse=True)
        return files[0] if files else None

    def load_tipps(self, filename=None):
        """Lädt Tipps aus JSON"""
        if filename is None:
            filename = self.find_latest_tipps_file()

        if not filename:
            return None

        try:
            with open(filename, "r") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading tipps: {e}")
            return None

    def display_current_tipps(self):
        """Zeigt aktuelle Tipps schön formatiert"""
        tipps = self.load_tipps()

        if not tipps:
            print("❌ No tipps file found")
            return

        data = tipps
        print("\n" + "="*80)
        print("KICKTIPBOT - TIPPS DASHBOARD")
        print(f"Generated: {data['generated']}")
        print("="*80 + "\n")

        matches = data.get("matches", [])

        for i, tip in enumerate(matches, 1):
            print(f"{i}. {tip['match']}")
            print(f"   🎯 Main Tip: {tip['main_tip']} (Confidence: {tip['confidence']})")
            print(f"   💡 Expected Points: {tip['expected_points']:.2f}")
            print(f"   📊 Lambda: Home={tip['lambda']['home']:.1f} Away={tip['lambda']['away']:.1f}")

            # Top-3 Alternativen
            alts = tip.get("top_3_alternatives", [])[:2]
            if alts:
                alts_str = ", ".join(f"{a['score']} (EP {a['ep']})" for a in alts)
                print(f"   🔄 Alternatives: {alts_str}")

            # Quellen
            sources = tip.get("data_sources", {})
            print(f"   📌 Sources: Odds={sources.get('odds', '?')} Expert={sources.get('expert', '?')} Form={sources.get('form', '?')}")
            print()

        # Summary
        summary = data.get("summary", {})
        print("="*80)
        print(f"Summary:")
        print(f"  Total Matches: {summary.get('total_matches', len(matches))}")
        print(f"  High Confidence (>60%): {summary.get('high_confidence', 0)}")
        print(f"  Low Risk (EP > 2.0): {summary.get('low_risk', 0)}")
        print("="*80 + "\n")

    def display_upcoming_matches(self, days_ahead=5):
        """Zeigt kommende Matches der nächsten X Tage"""
        print("\n" + "="*80)
        print(f"UPCOMING MATCHES (next {days_ahead} days)")
        print("="*80 + "\n")

        for day_offset in range(1, days_ahead + 1):
            date = (datetime.now() + timedelta(days=day_offset)).strftime("%Y-%m-%d")
            filename = f"tipps_{date}.json"

            if os.path.exists(filename):
                try:
                    with open(filename, "r") as f:
                        data = json.load(f)
                        print(f"📅 {date}")
                        for match in data.get("matches", []):
                            print(f"   • {match['match']} → {match['main_tip']}")
                        print()
                except:
                    pass

    def analyze_source_reliability(self):
        """Analysiert Zuverlässigkeit der Datenquellen"""
        print("\n" + "="*80)
        print("SOURCE RELIABILITY ANALYSIS")
        print("="*80 + "\n")

        source_stats = {}
        tip_files = sorted(Path(".").glob("tipps_*.json"))

        for file in tip_files:
            try:
                with open(file, "r") as f:
                    data = json.load(f)
                    for match in data.get("matches", []):
                        sources = match.get("data_sources", {})
                        for source_type, source_name in sources.items():
                            if source_name not in ("?", "none"):
                                if source_name not in source_stats:
                                    source_stats[source_name] = {"count": 0, "avg_ep": 0}
                                source_stats[source_name]["count"] += 1
                                source_stats[source_name]["avg_ep"] += match.get("expected_points", 0)
            except:
                pass

        if source_stats:
            print("Source Usage:")
            for source, stats in sorted(source_stats.items(), key=lambda x: x[1]["count"], reverse=True):
                avg_ep = stats["avg_ep"] / stats["count"] if stats["count"] > 0 else 0
                print(f"  {source:30} - Used: {stats['count']:2} times, Avg EP: {avg_ep:.2f}")
        else:
            print("No source data available")

        print("\n" + "="*80 + "\n")


def main():
    """Hauptfunktion"""
    dashboard = TippsDashboard()

    # Zeige aktuelle Tipps
    dashboard.display_current_tipps()

    # Zeige kommende Matches
    dashboard.display_upcoming_matches(days_ahead=3)

    # Quelle-Analyse
    dashboard.analyze_source_reliability()


if __name__ == "__main__":
    main()
