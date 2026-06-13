#!/usr/bin/env python3
"""
daily_tipps_generator.py - Generiert täglich Tipps für den nächsten Spieltag
Läuft als Cronjob: täglich um 20:00 UTC (22:00 CEST)

Features:
1. Durchsucht aktuelle Medien-Artikel für Match-Infos
2. Sammelt Quoten + Experten-Predictions
3. Generiert optimale Tipps für MORGEN
4. Speichert Tipps + Alternativ-Scores + Confidence-Levels
5. Präsentiert Dashboard mit Tipps
"""

import json
import requests
from datetime import datetime, timedelta
from data_fetcher import DataFetcher
from tipps_engine import TippsEngine
from database import TippsDatabase
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(name)s] %(message)s'
)
logger = logging.getLogger(__name__)


class DailyTippsGenerator:
    def __init__(self):
        self.fetcher = DataFetcher()
        self.engine = TippsEngine()
        self.db = TippsDatabase()
        self.tips_output_file = "tipps_tomorrow.json"

    def get_scheduled_matches(self, day_offset=1):
        """
        Holt die Matches für einen bestimmten Tag.
        day_offset=1 → Morgen, day_offset=0 → Heute
        """
        # OpenLigaDB für WM 2026 Matches
        try:
            url = "https://api.openligadb.de/getcurrentmatchday/wm2026"
            resp = requests.get(url, timeout=10)

            if resp.status_code != 200:
                logger.warning("OpenLigaDB not available, returning empty")
                return []

            matches = resp.json()
            target_date = (datetime.now() + timedelta(days=day_offset)).date()

            filtered = []
            for m in matches if isinstance(matches, list) else matches.get("matches", []):
                match_date = datetime.fromisoformat(
                    m.get("matchDateTime", "").replace("Z", "+00:00")
                ).date()

                if match_date == target_date:
                    filtered.append({
                        "team1": m.get("team1", {}).get("teamName", ""),
                        "team2": m.get("team2", {}).get("teamName", ""),
                        "match_id": m.get("matchID"),
                        "scheduled_time": m.get("matchDateTime")
                    })

            logger.info(f"Found {len(filtered)} matches for {target_date}")
            return filtered

        except Exception as e:
            logger.error(f"Error fetching scheduled matches: {e}")
            return []

    def generate_tip_with_analysis(self, team1, team2):
        """
        Generiert einen kompletten Tipp mit Analyse + Alternativen
        """
        logger.info(f"Generating tip: {team1} vs {team2}")

        try:
            # 1. Daten sammeln
            odds = self.fetcher.get_odds(team1, team2)
            expert = self.fetcher.get_expert_predictions(team1, team2)
            form = self.fetcher.get_team_stats(team1, team2)

            # 2. Tipp berechnen
            tip_result = self.engine.calculate_tip({
                "odds": odds,
                "expert": expert,
                "form": form
            })

            # 3. Formatiere Ausgabe
            return {
                "match": f"{team1} vs {team2}",
                "team1": team1,
                "team2": team2,
                "main_tip": tip_result["score_str"],
                "confidence": f"{tip_result['confidence']:.1%}",
                "expected_points": tip_result["expected_points"],
                "lambda": {
                    "home": tip_result["lambda_home"],
                    "away": tip_result["lambda_away"]
                },
                "top_3_alternatives": tip_result["top_3_alternatives"],
                "data_sources": {
                    "odds": odds.get("source", "unknown"),
                    "expert": expert.get("source", "none"),
                    "form": f"H:{form.get('home_form', '?')} A:{form.get('away_form', '?')}"
                },
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error generating tip for {team1} vs {team2}: {e}")
            return None

    def generate_all_tips(self, day_offset=1):
        """
        Generiert Tipps für alle Matches eines Tages
        """
        matches = self.get_scheduled_matches(day_offset)

        if not matches:
            logger.warning(f"No matches found for day offset {day_offset}")
            return []

        all_tips = []
        for match in matches:
            tip = self.generate_tip_with_analysis(match["team1"], match["team2"])
            if tip:
                all_tips.append(tip)

        return all_tips

    def save_tips_to_file(self, tips, filename=None):
        """
        Speichert Tipps als JSON
        """
        if filename is None:
            tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
            filename = f"tipps_{tomorrow}.json"

        output = {
            "generated": datetime.now().isoformat(),
            "matches": tips,
            "summary": {
                "total_matches": len(tips),
                "high_confidence": sum(1 for t in tips if float(t["confidence"].rstrip("%")) > 60),
                "low_risk": sum(1 for t in tips if t["expected_points"] > 2.0)
            }
        }

        with open(filename, "w") as f:
            json.dump(output, f, indent=2)

        logger.info(f"Tipps saved to {filename}")
        return filename

    def print_tips_summary(self, tips):
        """
        Schöne Ausgabe der Tipps
        """
        print("\n" + "="*70)
        print(f"KICKTIPBOT - DAILY TIPPS GENERATOR")
        print(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M UTC')}")
        print("="*70 + "\n")

        for i, tip in enumerate(tips, 1):
            print(f"{i}. {tip['match']}")
            print(f"   Main Tip: {tip['main_tip']} (Confidence: {tip['confidence']})")
            print(f"   Expected Points: {tip['expected_points']:.2f}")
            print(f"   Lambda: H={tip['lambda']['home']:.2f} A={tip['lambda']['away']:.2f}")
            print(f"   Top Alternatives: {', '.join(f\"{a['score']} ({a['ep']})\" for a in tip['top_3_alternatives'][:2])}")
            print(f"   Data: {tip['data_sources']}")
            print()

        print("="*70)
        print(f"Summary: {len(tips)} matches analyzed")
        high_conf = sum(1 for t in tips if float(t["confidence"].rstrip("%")) > 60)
        print(f"High Confidence (>60%): {high_conf}")
        print("="*70 + "\n")


def main():
    """Main entrypoint"""
    logger.info("Starting daily tipps generator")

    generator = DailyTippsGenerator()

    # Generiere Tipps für morgen
    tips = generator.generate_all_tips(day_offset=1)

    if tips:
        # Speichere als JSON
        generator.save_tips_to_file(tips)

        # Ausgabe
        generator.print_tips_summary(tips)

        logger.info(f"✓ Generated {len(tips)} tips")
    else:
        logger.warning("No tips generated (no matches found)")

    return len(tips) > 0


if __name__ == "__main__":
    import sys
    success = main()
    sys.exit(0 if success else 1)
