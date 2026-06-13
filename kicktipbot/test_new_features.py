#!/usr/bin/env python3
"""
test_new_features.py - Validierung der neuen KickTipBot Features
"""

import sys
from datetime import datetime

def test_data_fetcher():
    """Test erweiterte DataFetcher-Quellen"""
    print("\n" + "="*70)
    print("TEST 1: Extended DataFetcher Sources")
    print("="*70)

    from data_fetcher import DataFetcher

    fetcher = DataFetcher()

    test_matches = [
        ("Deutschland", "Argentinien"),
        ("Frankreich", "Brasilien"),
        ("Spanien", "England"),
    ]

    for team1, team2 in test_matches:
        print(f"\n→ {team1} vs {team2}")

        # Test Quoten
        odds = fetcher.get_odds(team1, team2)
        if odds:
            print(f"  ✓ Odds: {odds['home']:.2f} / {odds['draw']:.2f} / {odds['away']:.2f} ({odds['source']})")
        else:
            print(f"  ✗ No odds")

        # Test Experten
        expert = fetcher.get_expert_predictions(team1, team2)
        if expert:
            consensus_map = {1: "HOME", 0: "DRAW", 2: "AWAY", -1: "NONE"}
            print(f"  ✓ Expert: {consensus_map[expert['expert_consensus']]} ({expert['confidence']:.1%}) - {expert['source']}")
        else:
            print(f"  ✗ No expert predictions")

        # Test Form
        form = fetcher.get_team_stats(team1, team2)
        if form:
            print(f"  ✓ Form: H={form['home_form']} A={form['away_form']}")
        else:
            print(f"  ✗ No form data")

    print("\n✓ DataFetcher test complete\n")


def test_tipps_engine_variety():
    """Test dass Engine verschiedene Score-Tipps generiert"""
    print("\n" + "="*70)
    print("TEST 2: TippsEngine Variety (kein reines 1:0/0:1)")
    print("="*70)

    from tipps_engine import TippsEngine

    engine = TippsEngine()

    test_cases = [
        # (team1, team2, odds_dict)
        ("Favorit", "Underdog", {"home": 1.30, "draw": 5.0, "away": 9.0}),
        ("Balanced1", "Balanced2", {"home": 2.0, "draw": 3.2, "away": 3.5}),
        ("Underdog", "Favorit", {"home": 7.0, "draw": 4.0, "away": 1.45}),
        ("High-Scoring1", "High-Scoring2", {"home": 2.5, "draw": 3.0, "away": 2.8}),
    ]

    for name1, name2, odds in test_cases:
        result = engine.calculate_tip({
            "odds": odds,
            "expert": None,
            "form": None
        })

        print(f"\n{name1:20} vs {name2:20}")
        print(f"  Odds: {odds['home']:.1f} / {odds['draw']:.1f} / {odds['away']:.1f}")
        print(f"  ✓ Main Tip: {result['score_str']} (EP={result['expected_points']:.2f}, Conf={result['confidence']:.1%})")

        # Show top-3
        alts = result.get("top_3_alternatives", [])[:3]
        for i, alt in enumerate(alts, 1):
            print(f"    {i}. {alt['score']} (EP {alt['ep']})")

        # Validierung: Nicht nur 1:0 oder 0:1
        score = result['score_str']
        is_conservative = score in ["1:0", "0:1", "0:0", "1:1"]
        status = "✓ GOOD" if not is_conservative else "⚠ Conservative"
        print(f"  {status}")

    print("\n✓ Engine variety test complete\n")


def test_daily_generator():
    """Test DailyTippsGenerator"""
    print("\n" + "="*70)
    print("TEST 3: DailyTippsGenerator")
    print("="*70)

    from daily_tipps_generator import DailyTippsGenerator

    generator = DailyTippsGenerator()

    # Test: Holt scheduled matches
    matches = generator.get_scheduled_matches(day_offset=1)
    print(f"\nScheduled matches for tomorrow: {len(matches)}")
    if matches:
        for m in matches[:3]:
            print(f"  • {m['team1']} vs {m['team2']}")

    # Test: Generiere einen Tipp
    if matches and len(matches) > 0:
        m = matches[0]
        tip = generator.generate_tip_with_analysis(m["team1"], m["team2"])

        print(f"\nGenerated tip for {m['team1']} vs {m['team2']}:")
        print(f"  Main Tip: {tip['main_tip']}")
        print(f"  Confidence: {tip['confidence']}")
        print(f"  Expected Points: {tip['expected_points']:.2f}")
        print(f"  Data Sources: {tip['data_sources']}")

    print("\n✓ DailyTippsGenerator test complete\n")


def test_dashboard():
    """Test Dashboard"""
    print("\n" + "="*70)
    print("TEST 4: TippsDashboard")
    print("="*70)

    from tipps_dashboard import TippsDashboard

    dashboard = TippsDashboard()

    latest = dashboard.find_latest_tipps_file()
    if latest:
        print(f"\nLatest tipps file: {latest}")
        tipps = dashboard.load_tipps(latest)
        if tipps:
            print(f"Loaded {len(tipps.get('matches', []))} matches")
            dashboard.display_current_tipps()
    else:
        print("\nNo tipps file found (will be created on first run)")

    print("\n✓ Dashboard test complete\n")


def run_all_tests():
    """Führe alle Tests durch"""
    print("\n")
    print("╔" + "="*68 + "╗")
    print("║" + " "*15 + "KICKTIPBOT - FEATURE VALIDATION" + " "*23 + "║")
    print("║" + " "*10 + f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}" + " "*39 + "║")
    print("╚" + "="*68 + "╝")

    tests = [
        ("DataFetcher Extended Sources", test_data_fetcher),
        ("TippsEngine Variety", test_tipps_engine_variety),
        ("DailyTippsGenerator", test_daily_generator),
        ("Dashboard", test_dashboard),
    ]

    passed = 0
    failed = 0

    for test_name, test_func in tests:
        try:
            test_func()
            passed += 1
        except Exception as e:
            print(f"\n✗ {test_name} FAILED: {e}")
            failed += 1

    print("\n" + "="*70)
    print(f"SUMMARY: {passed} passed, {failed} failed")
    print("="*70 + "\n")

    return failed == 0


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
