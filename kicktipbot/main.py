#!/usr/bin/env python3
"""
kicktipbot - Automatischer WM 2026 Tipp-Bot für kicktipp.at
"""

import time
import logging
import sys
from datetime import datetime

from tipps_engine import TippsEngine
from database import TippsDatabase

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)
db = TippsDatabase()


def process_match(fetcher, engine, match):
    """
    Verarbeitet ein einzelnes Match:
    1. Datenfetcher: Quoten, Experten, Form holen
    2. Tipps-Engine: Optimalen Score berechnen
    3. Bot: Score platzieren (zurückgeben für späteren submit)
    """
    team1 = match["team1"]
    team2 = match["team2"]

    logger.info(f"→ {team1} vs {team2}")
    db.log_event("INFO", f"Processing: {team1} vs {team2}")

    odds = fetcher.get_odds(team1, team2)
    expert = fetcher.get_expert_predictions(team1, team2)
    form = fetcher.get_team_stats(team1, team2)

    tip_result = engine.calculate_tip({
        "odds": odds,
        "expert": expert,
        "form": form
    })

    score_str = tip_result["score_str"]
    ep = tip_result["expected_points"]
    conf = tip_result["confidence"]

    logger.info(f"  → Tipp: {score_str} | EP: {ep:.2f} | Conf: {conf:.1%}")
    logger.info(f"  → Lambda: H={tip_result['lambda_home']:.2f} A={tip_result['lambda_away']:.2f}")

    match_id = f"{team1}_{team2}_{datetime.now().strftime('%Y%m%d')}"
    db.save_tip(match_id, team1, team2, tip_result, odds, expert, form)

    return tip_result


def run_tipps_round():
    """Hauptfunktion: Komplette Tipps-Runde"""
    from bot import KicktippBot
    from data_fetcher import DataFetcher

    bot = None
    fetcher = DataFetcher()
    engine = TippsEngine()

    db.log_event("INFO", "=== Starting tipps round ===")

    try:
        bot = KicktippBot()

        if not bot.login():
            db.log_event("ERROR", "Login failed")
            return False
        db.log_event("INFO", "Login successful")

        if not bot.open_tippabgabe():
            db.log_event("ERROR", "Failed to open tippabgabe")
            return False

        matches = bot.get_matches()
        if not matches:
            logger.warning("No matches found")
            db.log_event("WARNING", "No matches found")
            return True

        db.log_event("INFO", f"Found {len(matches)} matches")

        placed = 0
        for match in matches:
            try:
                tip_result = process_match(fetcher, engine, match)
                home_g, away_g = tip_result["score"]

                if bot.place_tip(match, home_g, away_g):
                    placed += 1
                    db.log_event("INFO", f"Placed: {match['team1']} {home_g}:{away_g} {match['team2']}")
                time.sleep(0.3)

            except Exception as e:
                logger.error(f"Error processing match: {e}")
                db.log_event("ERROR", f"Match error: {e}")
                continue

        if placed > 0:
            if bot.submit_tips():
                db.log_event("SUCCESS", f"Round complete: {placed} tipps submitted")
                logger.info(f"✓ {placed} Tipps abgegeben")
            else:
                db.log_event("ERROR", "Submit failed - tipps placed but not submitted")
                return False
        else:
            db.log_event("WARNING", "No tipps placed")

        return True

    except Exception as e:
        logger.error(f"Round failed: {e}")
        db.log_event("ERROR", f"Round failed: {e}")
        return False

    finally:
        if bot:
            bot.close()


def test_engine():
    """Test-Modus: Engine ohne Bot ausprobieren (für Verifikation)"""
    engine = TippsEngine()

    test_matches = [
        ("Deutschland", "Argentinien", {"home": 4.50, "draw": 3.60, "away": 1.75}),
        ("Frankreich", "Österreich", {"home": 1.30, "draw": 5.50, "away": 9.00}),
        ("Spanien", "Brasilien", {"home": 2.50, "draw": 3.20, "away": 2.80}),
        ("England", "USA", {"home": 1.45, "draw": 4.50, "away": 6.50}),
        ("Marokko", "Senegal", {"home": 2.20, "draw": 3.10, "away": 3.30}),
    ]

    print("\n=== TIPPS-ENGINE TEST ===\n")
    for t1, t2, odds in test_matches:
        result = engine.calculate_tip({
            "odds": odds,
            "expert": None,
            "form": None
        })

        print(f"{t1:15} vs {t2:15}")
        print(f"  Quoten: {odds['home']:.2f} / {odds['draw']:.2f} / {odds['away']:.2f}")
        print(f"  → Tipp: {result['score_str']} (EP: {result['expected_points']:.2f}, Conf: {result['confidence']:.1%})")
        print(f"  → Lambda: H={result['lambda_home']:.2f} A={result['lambda_away']:.2f}")
        alts = ", ".join("{} (EP {})".format(a["score"], a["ep"]) for a in result["top_3_alternatives"])
        print(f"  → Top-3: {alts}")
        print()


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        test_engine()
    else:
        logger.info("=== kicktipbot gestartet ===")
        success = run_tipps_round()
        sys.exit(0 if success else 1)
