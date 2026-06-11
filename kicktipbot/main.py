#!/usr/bin/env python3
"""
kicktipbot - Automatischer WM 2026 Tipp-Bot für kicktipp.at
"""

from bot import KicktippBot
from data_fetcher import DataFetcher
from tipps_engine import TippsEngine
from database import TippsDatabase
import time
import logging
from datetime import datetime

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)
db = TippsDatabase()

def run_tipps_round():
    """Führt eine komplette Tipp-Runde durch"""
    bot = None
    try:
        # Initialisiere Komponenten
        bot = KicktippBot()
        fetcher = DataFetcher()
        engine = TippsEngine()

        db.log_event("INFO", "Starting tipps round")

        # Login
        if not bot.login():
            logger.error("Failed to login")
            db.log_event("ERROR", "Login failed")
            return False

        db.log_event("INFO", "Login successful")

        # Hole Matches
        matches = bot.get_matches()
        if not matches:
            logger.info("No matches found")
            db.log_event("WARNING", "No matches found")
            return True

        db.log_event("INFO", f"Found {len(matches)} matches")

        # Für jedes Match: Daten holen + Tip berechnen + Platzieren
        placed_count = 0
        for match in matches:
            try:
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

                # Speichere in Datenbank
                match_id = f"{match['team1']}_{match['team2']}_{datetime.now().timestamp()}"
                db.save_tip(
                    match_id,
                    match['team1'],
                    match['team2'],
                    tip_str,
                    tip_result['confidence'],
                    odds,
                    expert
                )

                # Platziere Tip
                if bot.place_tip(match, tip_str):
                    placed_count += 1
                    db.log_event("INFO", f"Tip placed: {match['team1']} vs {match['team2']} = {tip_str}")

                time.sleep(0.5)

            except Exception as e:
                logger.error(f"Error processing match {match.get('team1')}: {e}")
                db.log_event("ERROR", f"Match processing error: {str(e)}")
                continue

        # Sende alle Tipps ab
        if placed_count > 0:
            bot.submit_tips()
            db.log_event("INFO", f"Tips submitted: {placed_count} tipps")

        logger.info(f"Tipps-Runde abgeschlossen! {placed_count} Tipps platziert")
        db.log_event("SUCCESS", f"Round complete: {placed_count} tips placed")
        return True

    except Exception as e:
        logger.error(f"Error in tipps round: {e}")
        db.log_event("ERROR", f"Round failed: {str(e)}")
        return False

    finally:
        if bot:
            bot.close()

if __name__ == "__main__":
    logger.info("=== kicktipbot gestartet ===")
    run_tipps_round()
