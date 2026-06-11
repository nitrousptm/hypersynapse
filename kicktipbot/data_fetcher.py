"""
Data Fetcher für kicktipbot
- Holt Quoten von zuverlässigen Quellen (The Odds API, OpenLigaDB)
- Scraped Experten-Predictions von Reddit (JSON-API) und Sportschau
- Holt Team-Form von OpenLigaDB / football-data.org
"""

import requests
import re
import json
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
import config


class DataFetcher:
    def __init__(self):
        self.headers = {
            "User-Agent": "kicktipbot/1.0 (educational)",
            "Accept": "application/json"
        }
        # Cache für die Session - vermeidet doppelte Requests
        self._cache = {}

    # ============== QUOTEN ==============

    def get_odds_the_odds_api(self, team1, team2):
        """
        The Odds API - 500 free requests/month
        https://the-odds-api.com
        Liefert echte Quoten von vielen Bookmakers.
        """
        if not config.ODDS_API_KEY:
            return None

        try:
            cache_key = "odds_api_wm2026"
            if cache_key in self._cache:
                events = self._cache[cache_key]
            else:
                url = "https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/odds"
                params = {
                    "apiKey": config.ODDS_API_KEY,
                    "regions": "eu",
                    "markets": "h2h",
                    "oddsFormat": "decimal"
                }
                resp = requests.get(url, params=params, timeout=10)
                if resp.status_code != 200:
                    return None
                events = resp.json()
                self._cache[cache_key] = events

            # Finde das Match
            for event in events:
                home = event.get("home_team", "").lower()
                away = event.get("away_team", "").lower()

                if (team1.lower() in home or home in team1.lower()) and \
                   (team2.lower() in away or away in team2.lower()):
                    # Mittelwert aller Bookmakers
                    bookies = event.get("bookmakers", [])
                    if not bookies:
                        continue

                    home_odds, draw_odds, away_odds = [], [], []
                    for b in bookies:
                        for market in b.get("markets", []):
                            if market.get("key") == "h2h":
                                for outcome in market.get("outcomes", []):
                                    name = outcome.get("name", "")
                                    price = outcome.get("price", 0)
                                    if name == event["home_team"]:
                                        home_odds.append(price)
                                    elif name == event["away_team"]:
                                        away_odds.append(price)
                                    else:
                                        draw_odds.append(price)

                    if home_odds and away_odds:
                        return {
                            "home": sum(home_odds) / len(home_odds),
                            "draw": sum(draw_odds) / len(draw_odds) if draw_odds else 3.2,
                            "away": sum(away_odds) / len(away_odds),
                            "source": "the-odds-api",
                            "bookmaker_count": len(bookies),
                            "timestamp": datetime.now().isoformat()
                        }
            return None
        except Exception as e:
            print(f"[DataFetcher] The Odds API error: {e}")
            return None

    def get_odds_oddsportal(self, team1, team2):
        """
        OddsPortal Scraping als Fallback.
        Aggregiert Quoten von 50+ Bookmakers.
        """
        try:
            # OddsPortal hat eine Such-API
            slug = f"{team1.lower().replace(' ', '-')}-{team2.lower().replace(' ', '-')}"
            url = f"https://www.oddsportal.com/search/{slug}/"

            resp = requests.get(url, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }, timeout=10)

            if resp.status_code != 200:
                return None

            soup = BeautifulSoup(resp.content, "html.parser")

            # Parse OddsPortal odds (Format: <span data-odds-type="1">2.50</span>)
            home_el = soup.find("span", {"data-odds-type": "1"})
            draw_el = soup.find("span", {"data-odds-type": "X"})
            away_el = soup.find("span", {"data-odds-type": "2"})

            if home_el and away_el:
                return {
                    "home": float(home_el.text.strip()),
                    "draw": float(draw_el.text.strip()) if draw_el else 3.2,
                    "away": float(away_el.text.strip()),
                    "source": "oddsportal",
                    "timestamp": datetime.now().isoformat()
                }
            return None
        except Exception as e:
            print(f"[DataFetcher] OddsPortal error: {e}")
            return None

    def get_odds_heuristic(self, team1, team2):
        """
        Heuristik-Fallback: Schätzt Quoten basierend auf FIFA-Ranking.
        Wird genutzt wenn keine echte Quote verfügbar ist.
        """
        # FIFA Rankings (vereinfacht, Stand 2026)
        rankings = {
            "argentina": 1, "frankreich": 2, "france": 2, "spanien": 3, "spain": 3,
            "england": 4, "brasilien": 5, "brazil": 5, "portugal": 6, "niederlande": 7,
            "netherlands": 7, "belgien": 8, "belgium": 8, "deutschland": 9, "germany": 9,
            "italien": 10, "italy": 10, "kroatien": 11, "croatia": 11,
            "marokko": 12, "morocco": 12, "kolumbien": 13, "colombia": 13,
            "uruguay": 14, "schweiz": 15, "switzerland": 15, "usa": 16,
            "japan": 17, "senegal": 18, "iran": 19, "mexiko": 20, "mexico": 20,
            "österreich": 21, "austria": 21, "serbien": 22, "serbia": 22,
            "dänemark": 23, "denmark": 23, "ukraine": 24, "polen": 25, "poland": 25,
            "ecuador": 26, "südkorea": 27, "south korea": 27, "kanada": 28, "canada": 28,
            "wales": 29, "ghana": 30, "kamerun": 31, "cameroon": 31, "katar": 32, "qatar": 32,
        }

        r1 = rankings.get(team1.lower(), 50)
        r2 = rankings.get(team2.lower(), 50)

        # Stärke-Differenz → Quoten
        diff = r2 - r1  # Positiv = team1 stärker

        if diff > 20:
            return {"home": 1.30, "draw": 5.0, "away": 9.0, "source": "heuristic_ranking"}
        elif diff > 10:
            return {"home": 1.60, "draw": 3.8, "away": 5.5, "source": "heuristic_ranking"}
        elif diff > 5:
            return {"home": 2.00, "draw": 3.2, "away": 3.8, "source": "heuristic_ranking"}
        elif diff > -5:
            return {"home": 2.60, "draw": 3.0, "away": 2.80, "source": "heuristic_ranking"}
        elif diff > -10:
            return {"home": 3.80, "draw": 3.2, "away": 2.00, "source": "heuristic_ranking"}
        elif diff > -20:
            return {"home": 5.50, "draw": 3.8, "away": 1.60, "source": "heuristic_ranking"}
        else:
            return {"home": 9.0, "draw": 5.0, "away": 1.30, "source": "heuristic_ranking"}

    def get_odds(self, team1, team2):
        """Holt Quoten - probiert mehrere Quellen"""
        print(f"[DataFetcher] Getting odds: {team1} vs {team2}")

        # 1. The Odds API (best quality)
        odds = self.get_odds_the_odds_api(team1, team2)
        if odds:
            print(f"[DataFetcher] ✓ Odds from The Odds API")
            return odds

        # 2. OddsPortal scraping
        odds = self.get_odds_oddsportal(team1, team2)
        if odds:
            print(f"[DataFetcher] ✓ Odds from OddsPortal")
            return odds

        # 3. Heuristik
        odds = self.get_odds_heuristic(team1, team2)
        print(f"[DataFetcher] ⚠ Using heuristic odds (FIFA ranking based)")
        odds["timestamp"] = datetime.now().isoformat()
        return odds

    # ============== EXPERTEN ==============

    def get_reddit_predictions(self, team1, team2):
        """
        Reddit r/soccer Predictions via JSON-API.
        Analysiert Match-Thread-Kommentare für Sentiment.
        """
        try:
            url = "https://www.reddit.com/r/soccer/search.json"
            params = {
                "q": f"{team1} vs {team2}",
                "restrict_sr": "true",
                "sort": "new",
                "t": "month",
                "limit": 10
            }

            resp = requests.get(url, params=params, headers=self.headers, timeout=10)
            if resp.status_code != 200:
                return None

            data = resp.json()
            posts = data.get("data", {}).get("children", [])

            if not posts:
                return None

            home_mentions, away_mentions, draw_mentions = 0, 0, 0

            for post in posts[:10]:
                post_data = post.get("data", {})
                text = (post_data.get("title", "") + " " + post_data.get("selftext", "")).lower()

                # Score = Reddit-Upvotes (Gewichtung)
                weight = max(1, post_data.get("score", 1))

                # Pattern-Matching für Predictions
                t1_lower = team1.lower()
                t2_lower = team2.lower()

                # Suche nach "team1 win", "team1 to win", "team1 victory"
                if re.search(rf"{re.escape(t1_lower)}\s+(to\s+)?(win|wins|victory|beats)", text):
                    home_mentions += weight
                elif re.search(rf"{re.escape(t2_lower)}\s+(to\s+)?(win|wins|victory|beats)", text):
                    away_mentions += weight
                elif "draw" in text or "tie" in text or "1-1" in text or "2-2" in text:
                    draw_mentions += weight

            total = home_mentions + away_mentions + draw_mentions
            if total == 0:
                return None

            # Bestimme Konsens
            if home_mentions > away_mentions and home_mentions > draw_mentions:
                consensus = 1
                confidence = home_mentions / total
            elif away_mentions > home_mentions and away_mentions > draw_mentions:
                consensus = 2
                confidence = away_mentions / total
            else:
                consensus = 0
                confidence = draw_mentions / total

            return {
                "expert_consensus": consensus,
                "confidence": round(confidence, 3),
                "source": "reddit_r_soccer",
                "sample_size": len(posts),
                "mentions": {
                    "home": home_mentions,
                    "draw": draw_mentions,
                    "away": away_mentions
                }
            }
        except Exception as e:
            print(f"[DataFetcher] Reddit error: {e}")
            return None

    def get_sportschau_predictions(self, team1, team2):
        """
        Scraped Sportschau WM 2026 Prognosen.
        """
        try:
            url = "https://www.sportschau.de/fussball/fifa-wm-2026/index.html"
            resp = requests.get(url, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }, timeout=10)

            if resp.status_code != 200:
                return None

            soup = BeautifulSoup(resp.content, "html.parser")

            # Suche nach Artikeln die beide Teams erwähnen
            articles = soup.find_all(["article", "div"], class_=re.compile(r"(teaser|article)"))

            home_count, away_count = 0, 0

            for article in articles:
                text = article.get_text().lower()
                if team1.lower() in text and team2.lower() in text:
                    # Prognose-Indikatoren
                    if any(p in text for p in [f"{team1.lower()} gewinnt", f"sieg für {team1.lower()}", f"{team1.lower()}-favorit"]):
                        home_count += 1
                    elif any(p in text for p in [f"{team2.lower()} gewinnt", f"sieg für {team2.lower()}", f"{team2.lower()}-favorit"]):
                        away_count += 1

            if home_count == 0 and away_count == 0:
                return None

            total = home_count + away_count
            consensus = 1 if home_count > away_count else 2

            return {
                "expert_consensus": consensus,
                "confidence": round(max(home_count, away_count) / total, 3),
                "source": "sportschau",
                "sample_size": total
            }
        except Exception as e:
            print(f"[DataFetcher] Sportschau error: {e}")
            return None

    def get_expert_predictions(self, team1, team2):
        """Aggregiert Experten-Predictions"""
        print(f"[DataFetcher] Getting expert predictions: {team1} vs {team2}")

        # Sammle aus mehreren Quellen
        predictions = []

        reddit = self.get_reddit_predictions(team1, team2)
        if reddit:
            predictions.append(reddit)
            print(f"[DataFetcher] ✓ Reddit: consensus={reddit['expert_consensus']}, conf={reddit['confidence']}")

        sportschau = self.get_sportschau_predictions(team1, team2)
        if sportschau:
            predictions.append(sportschau)
            print(f"[DataFetcher] ✓ Sportschau: consensus={sportschau['expert_consensus']}")

        if not predictions:
            return {
                "expert_consensus": -1,
                "confidence": 0.0,
                "source": "none"
            }

        # Aggregiere (gewichteter Durchschnitt)
        consensus_votes = [0, 0, 0]  # [draw, home, away]
        for p in predictions:
            c = p["expert_consensus"]
            if c in [0, 1, 2]:
                consensus_votes[c] += p["confidence"]

        final_consensus = consensus_votes.index(max(consensus_votes))
        final_confidence = max(consensus_votes) / sum(consensus_votes) if sum(consensus_votes) > 0 else 0.5

        return {
            "expert_consensus": final_consensus,
            "confidence": round(final_confidence, 3),
            "source": "+".join(p["source"] for p in predictions),
            "sample_size": sum(p.get("sample_size", 1) for p in predictions)
        }

    # ============== TEAM-FORM ==============

    def get_team_form(self, team):
        """
        Holt Team-Form (letzte Spiele).
        Nutzt OpenLigaDB oder fallback.
        """
        try:
            # OpenLigaDB hat Daten für viele Ligen
            url = f"https://api.openligadb.de/getmatchdata/em2024/{team}"
            resp = requests.get(url, headers=self.headers, timeout=5)

            if resp.status_code == 200:
                matches = resp.json()
                if isinstance(matches, list) and matches:
                    wins, draws, losses = 0, 0, 0
                    for m in matches[-5:]:  # Letzte 5 Spiele
                        if m.get("matchIsFinished"):
                            result = m.get("matchResults", [{}])[-1]
                            t1 = result.get("pointsTeam1", 0)
                            t2 = result.get("pointsTeam2", 0)

                            if m.get("team1", {}).get("teamName", "").lower() == team.lower():
                                if t1 > t2: wins += 1
                                elif t1 == t2: draws += 1
                                else: losses += 1
                            else:
                                if t2 > t1: wins += 1
                                elif t1 == t2: draws += 1
                                else: losses += 1

                    if wins + draws + losses > 0:
                        form_score = (wins * 3 + draws) / ((wins + draws + losses) * 3)
                        form = "good" if form_score > 0.6 else ("bad" if form_score < 0.3 else "neutral")

                        return {
                            "form": form,
                            "form_score": round(form_score, 2),
                            "last_5": {"W": wins, "D": draws, "L": losses}
                        }
        except Exception as e:
            print(f"[DataFetcher] Form error for {team}: {e}")

        return {"form": "neutral", "form_score": 0.5, "last_5": {}}

    def get_team_stats(self, team1, team2=None):
        """Holt Form für beide Teams"""
        home_form = self.get_team_form(team1)

        if team2:
            away_form = self.get_team_form(team2)
            return {
                "home_form": home_form["form"],
                "away_form": away_form["form"],
                "home_details": home_form,
                "away_details": away_form,
                "timestamp": datetime.now().isoformat()
            }

        return {
            "form": home_form["form"],
            "details": home_form,
            "timestamp": datetime.now().isoformat()
        }
