#!/usr/bin/env python3
"""
kicktipbot - Automatischer WM 2026 Tipp-Bot für kicktipp.at
"""

from bot import KicktippBot
from data_fetcher import DataFetcher
from tipps_engine import TippsEngine
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_tipps_round():
    """Führt eine komplette Tipp-Runde durch"""
    bot = None
    try:
        # Initialisiere Komponenten
        bot = KicktippBot()
        fetcher = DataFetcher()
        engine = TippsEngine()

        # Login
        if not bot.login():
            logger.error("Failed to login")
            return False

        # Hole Matches
        matches = bot.get_matches()
        if not matches:
            logger.info("No matches found")
            return True

        # Für jedes Match: Daten holen + Tip berechnen + Platzieren
        for match in matches:
            logger.info(f"Processing: {match['team1']} vs {match['team2']}")

            # Hole Daten
            odds = fetcher.get_odds(match['team1'], match['team2'])
            expert = fetcher.get_expert_predictions(match['team1'], match['team2'])
            form = fetcher.get_team_stats(match['team1'])

            # Berechne Tip
            match_data = {
                "odds": odds,
                "expert": expert,
                "form": form
            }
            tip_result = engine.calculate_tip(match_data)
            tip_str = engine.tip_to_string(tip_result)

            # Platziere Tip
            bot.place_tip(match, tip_str)
            time.sleep(0.5)

        # Sende alle Tipps ab
        bot.submit_tips()

        logger.info("Tipps-Runde abgeschlossen!")
        return True

    except Exception as e:
        logger.error(f"Error in tipps round: {e}")
        return False

    finally:
        if bot:
            bot.close()

if __name__ == "__main__":
    logger.info("=== kicktipbot gestartet ===")
    run_tipps_round()
