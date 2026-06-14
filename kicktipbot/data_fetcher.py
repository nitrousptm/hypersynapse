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


DE_TO_EN = {
    "deutschland": "germany", "frankreich": "france", "spanien": "spain",
    "niederlande": "netherlands", "belgien": "belgium", "brasilien": "brazil",
    "argentinien": "argentina", "portugal": "portugal", "kroatien": "croatia",
    "schweiz": "switzerland", "österreich": "austria", "schweden": "sweden",
    "dänemark": "denmark", "norwegen": "norway", "türkei": "turkey", "türkiye": "turkey",
    "serbien": "serbia", "ukraine": "ukraine", "polen": "poland", "schottland": "scotland",
    "tschechien": "czech republic", "ungarn": "hungary", "griechenland": "greece",
    "albanien": "albania", "marokko": "morocco", "senegal": "senegal",
    "nigeria": "nigeria", "ghana": "ghana", "kamerun": "cameroon", "tunesien": "tunisia",
    "algerien": "algeria", "ägypten": "egypt", "elfenbeinküste": "ivory coast",
    "südafrika": "south africa", "mali": "mali",
    "demokratische republik kongo": "dr congo", "dr kongo": "dr congo",
    "mexiko": "mexico", "usa": "usa", "kanada": "canada",
    "kolumbien": "colombia", "brasilien": "brazil", "argentinien": "argentina",
    "chile": "chile", "ecuador": "ecuador", "uruguay": "uruguay", "bolivien": "bolivia",
    "paraguay": "paraguay", "peru": "peru", "venezuela": "venezuela",
    "costa rica": "costa rica", "panama": "panama", "honduras": "honduras",
    "el salvador": "el salvador", "jamaika": "jamaica", "haiti": "haiti",
    "kap verde": "cape verde", "curaçao": "curacao",
    "japan": "japan", "südkorea": "south korea", "australien": "australia",
    "saudi-arabien": "saudi arabia", "iran": "iran", "irak": "iraq",
    "jordanien": "jordan", "oman": "oman", "katar": "qatar",
    "neuseeland": "new zealand", "usa": "united states",
    "bosnien": "bosnia", "bosnien-herzegowina": "bosnia and herzegovina",
}


def _normalize_team(name: str) -> str:
    n = name.lower().strip()
    return DE_TO_EN.get(n, n)


def _teams_match(espn_name: str, our_name: str) -> bool:
    a = _normalize_team(espn_name)
    b = _normalize_team(our_name)
    return a == b or a in b or b in a


class DataFetcher:
    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json"
        }
        # Cache für die Session - vermeidet doppelte Requests
        self._cache = {}

    # ============== ESPN ==============

    def _get_espn_events(self, date_str=None):
        """Holt ESPN Scoreboard für ein Datum (YYYYMMDD), cached pro Session."""
        key = f"espn_{date_str or 'today'}"
        if key in self._cache:
            return self._cache[key]
        url = "http://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard"
        if date_str:
            url += f"?dates={date_str}"
        try:
            resp = requests.get(url, timeout=10)
            if resp.status_code != 200:
                return []
            events = resp.json().get("events", [])
            self._cache[key] = events
            return events
        except Exception as e:
            print(f"[DataFetcher] ESPN error: {e}")
            return []

    def _find_espn_event(self, team1, team2):
        """Sucht ESPN-Event für gegebene Teams (heute + morgen)."""
        from datetime import datetime, timedelta
        today = datetime.utcnow()
        for offset in (0, 1, -1):
            d = (today + timedelta(days=offset)).strftime("%Y%m%d")
            for ev in self._get_espn_events(d):
                comps = ev.get("competitions", [{}])
                if not comps:
                    continue
                comp = comps[0]
                competitors = comp.get("competitors", [])
                if len(competitors) < 2:
                    continue
                names = [c.get("team", {}).get("displayName", "") for c in competitors]
                if _teams_match(names[0], team1) and _teams_match(names[1], team2):
                    return ev, comp, competitors
                if _teams_match(names[0], team2) and _teams_match(names[1], team1):
                    return ev, comp, list(reversed(competitors))
        return None, None, None

    @staticmethod
    def _american_to_decimal(odds_str):
        """Konvertiert amerikanische Moneyline zu dezimalen Quoten."""
        try:
            o = int(str(odds_str).replace("+", ""))
            if o > 0:
                return round(o / 100 + 1, 3)
            else:
                return round(100 / abs(o) + 1, 3)
        except Exception:
            return None

    def get_odds_espn(self, team1, team2):
        """Holt echte DraftKings-Quoten via ESPN API (kein API-Key nötig)."""
        _, comp, competitors = self._find_espn_event(team1, team2)
        if comp is None:
            return None
        try:
            odds_list = comp.get("odds", [None])
            odds = odds_list[0] if odds_list else None
            if not odds:
                return None
            ml = odds.get("moneyline", {})
            home = self._american_to_decimal(ml.get("home", {}).get("close", {}).get("odds"))
            away = self._american_to_decimal(ml.get("away", {}).get("close", {}).get("odds"))
            draw = self._american_to_decimal(ml.get("draw", {}).get("close", {}).get("odds"))
            if home and away:
                return {
                    "home": home,
                    "draw": draw or 3.5,
                    "away": away,
                    "source": "espn_draftkings",
                    "timestamp": datetime.now().isoformat()
                }
        except Exception as e:
            print(f"[DataFetcher] ESPN odds parse error: {e}")
        return None

    def get_form_espn(self, team1, team2):
        """Holt Team-Form aus ESPN (letzte Ergebnisse W/L/T)."""
        _, comp, competitors = self._find_espn_event(team1, team2)
        if not competitors:
            return {"home_form": "neutral", "away_form": "neutral"}

        def parse_form(c):
            form_str = c.get("form", "")
            if not form_str:
                records = c.get("records", [{}])
                rec = records[0] if records else {}
                w = int(rec.get("wins", 0) or 0)
                d = int(rec.get("ties", 0) or 0)
                l = int(rec.get("losses", 0) or 0)
                total = w + d + l
                if total == 0:
                    return "neutral", 0.5
                score = (w * 3 + d) / (total * 3)
                return ("good" if score > 0.6 else "bad" if score < 0.3 else "neutral"), round(score, 2)
            wins = form_str.upper().count("W")
            losses = form_str.upper().count("L")
            n = len(form_str)
            if n == 0:
                return "neutral", 0.5
            score = wins / n
            return ("good" if score > 0.6 else "bad" if score < 0.3 else "neutral"), round(score, 2)

        home_form, home_score = parse_form(competitors[0])
        away_form, away_score = parse_form(competitors[1])
        return {
            "home_form": home_form,
            "away_form": away_form,
            "home_details": {"form": home_form, "form_score": home_score},
            "away_details": {"form": away_form, "form_score": away_score},
            "timestamp": datetime.now().isoformat()
        }

    def get_expert_espn(self, team1, team2):
        """Nutzt ESPN Win-Probability (aus Odds) als Experten-Proxy."""
        odds = self.get_odds_espn(team1, team2)
        if not odds:
            return None
        try:
            h = 1 / odds["home"]
            a = 1 / odds["away"]
            d = 1 / odds.get("draw", 3.5)
            total = h + a + d
            ph, pd, pa = h / total, d / total, a / total
            if ph > pa and ph > pd:
                consensus, conf = 1, ph
            elif pa > ph and pa > pd:
                consensus, conf = 2, pa
            else:
                consensus, conf = 0, pd
            return {
                "expert_consensus": consensus,
                "confidence": round(conf, 3),
                "source": "espn_implied_probability",
                "sample_size": 1
            }
        except Exception:
            return None

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
        Heuristik-Fallback: Schätzt Quoten basierend auf FIFA-Ranking WM 2026.
        Wird genutzt wenn keine echte Quote verfügbar ist.
        """
        # FIFA Rankings (WM 2026 Qualifikation, Stand Juni 2026)
        rankings = {
            # Tier 1 (1-10)
            "argentina": 1, "argentinien": 1,
            "frankreich": 2, "france": 2,
            "spanien": 3, "spain": 3,
            "england": 4,
            "brasilien": 5, "brazil": 5,
            "portugal": 6,
            "niederlande": 7, "netherlands": 7, "holland": 7,
            "belgien": 8, "belgium": 8,
            "deutschland": 9, "germany": 9,
            "kroatien": 11, "croatia": 11,
            # Tier 2 (11-20)
            "marokko": 12, "morocco": 12,
            "kolumbien": 13, "colombia": 13,
            "uruguay": 14,
            "schweiz": 15, "switzerland": 15,
            "usa": 16, "vereinigte staaten": 16,
            "japan": 17,
            "senegal": 18,
            "mexiko": 19, "mexico": 19,
            "österreich": 20, "austria": 20,
            # Tier 3 (21-35)
            "südkorea": 21, "south korea": 21, "korea": 21,
            "serbien": 22, "serbia": 22,
            "dänemark": 23, "denmark": 23,
            "ukraine": 24,
            "türkei": 25, "turkey": 25, "turkiye": 25,
            "polen": 26, "poland": 26,
            "ecuador": 27,
            "kanada": 28, "canada": 28,
            "australien": 29, "australia": 29,
            "tschechien": 30, "czech republic": 30, "czechia": 30, "tschechische republik": 30,
            "schottland": 31, "scotland": 31,
            "katar": 32, "qatar": 32,
            "panama": 33,
            "bolivien": 34, "bolivia": 34,
            "paraguay": 35,
            # Tier 4 (36-48)
            "jamaika": 36, "jamaica": 36,
            "ghana": 37,
            "kamerun": 38, "cameroon": 38,
            "algerien": 39, "algeria": 39,
            "nigeria": 40,
            "elfenbeinküste": 41, "ivory coast": 41, "côte d'ivoire": 41,
            "saudi-arabien": 42, "saudi arabia": 42, "saudi arabien": 42,
            "südafrika": 43, "south africa": 43,
            "bosnien-herzegowina": 44, "bosnien": 44, "bosnia": 44, "bosnien und herzegowina": 44,
            "haiti": 45,
            "el salvador": 46,
            "honduras": 47,
            "neuseeland": 48, "new zealand": 48,
            "venezuela": 44, "chile": 30, "griechenland": 35, "greece": 35,
            "albanien": 38, "albania": 38, "norwegen": 29, "norway": 29,
            "iran": 34, "irak": 40, "iraq": 40,
            "ägypten": 39, "egypt": 39, "mali": 43, "tunesien": 38, "tunisia": 38,
            "demokratische republik kongo": 42, "dr kongo": 42, "congo": 42,
            "jordanien": 44, "jordan": 44, "oman": 46,
            "costa rica": 40, "nicaragua": 50,
        }

        r1 = rankings.get(team1.lower(), 50)
        r2 = rankings.get(team2.lower(), 50)

        # Stärke-Differenz → Quoten (feinere Abstufung)
        diff = r2 - r1  # Positiv = team1 (Heim) stärker

        src = "heuristic_ranking"
        if diff > 20:
            return {"home": 1.25, "draw": 5.0,  "away": 10.0, "source": src}
        elif diff > 10:
            return {"home": 1.45, "draw": 4.2,  "away": 6.5,  "source": src}
        elif diff > 5:
            return {"home": 1.65, "draw": 3.8,  "away": 5.0,  "source": src}
        elif diff > 2:
            return {"home": 2.00, "draw": 3.4,  "away": 3.6,  "source": src}
        elif diff > -2:
            return {"home": 2.50, "draw": 3.1,  "away": 2.80, "source": src}
        elif diff > -5:
            return {"home": 3.60, "draw": 3.4,  "away": 2.00, "source": src}
        elif diff > -10:
            return {"home": 5.00, "draw": 3.8,  "away": 1.65, "source": src}
        elif diff > -20:
            return {"home": 6.50, "draw": 4.2,  "away": 1.45, "source": src}
        else:
            return {"home": 10.0, "draw": 5.0,  "away": 1.25, "source": src}

    def get_odds_betano(self, team1, team2):
        """Betano-Quoten scraping"""
        try:
            url = "https://betano.de/sports/soccer"
            resp = requests.get(url, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }, timeout=10)

            if resp.status_code == 200:
                soup = BeautifulSoup(resp.content, "html.parser")
                for match in soup.find_all("div", class_=re.compile(r"match|event")):
                    text = match.get_text()
                    if team1.lower() in text.lower() and team2.lower() in text.lower():
                        # Extrahiere Quoten (1, X, 2)
                        odds_text = re.findall(r"[\d.]+", text)
                        if len(odds_text) >= 3:
                            try:
                                return {
                                    "home": float(odds_text[0]),
                                    "draw": float(odds_text[1]),
                                    "away": float(odds_text[2]),
                                    "source": "betano"
                                }
                            except:
                                pass
            return None
        except Exception as e:
            print(f"[DataFetcher] Betano error: {e}")
            return None

    def get_odds_bet365(self, team1, team2):
        """Bet365-Quoten (simuliert mit heuristic enhancement)"""
        # Bet365 blockiert Scraping, daher nutzen wir eine verbesserte Heuristik
        # basierend auf bekannten Patterns
        odds = self.get_odds_heuristic(team1, team2)
        odds["source"] = "bet365_heuristic"
        return odds

    def get_odds(self, team1, team2):
        """Holt Quoten - probiert MEHRERE Quellen mit Fallbacks"""
        print(f"[DataFetcher] Getting odds: {team1} vs {team2}")

        # 1. The Odds API (best quality, wenn API-Key vorhanden)
        odds = self.get_odds_the_odds_api(team1, team2)
        if odds:
            print(f"[DataFetcher] ✓ Odds from The Odds API")
            odds["timestamp"] = datetime.now().isoformat()
            return odds

        # 2. ESPN / DraftKings (kostenlos, kein API-Key nötig)
        odds = self.get_odds_espn(team1, team2)
        if odds:
            print(f"[DataFetcher] ✓ Odds from ESPN/DraftKings")
            return odds

        # 3. OddsPortal scraping
        odds = self.get_odds_oddsportal(team1, team2)
        if odds:
            print(f"[DataFetcher] ✓ Odds from OddsPortal")
            odds["timestamp"] = datetime.now().isoformat()
            return odds

        # 4. Betano
        odds = self.get_odds_betano(team1, team2)
        if odds:
            print(f"[DataFetcher] ✓ Odds from Betano")
            odds["timestamp"] = datetime.now().isoformat()
            return odds

        # 5. Heuristik (letzter Fallback)
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

    def get_tipico_predictions(self, team1, team2):
        """Scrape Tipico Quoten + Experten-Tipps"""
        try:
            # Tipico hat eine Match-Suche mit Expert-Tips
            url = "https://www.tipico.de/sports/soccer"
            resp = requests.get(url, headers=self.headers, timeout=10)
            if resp.status_code != 200:
                return None

            soup = BeautifulSoup(resp.content, "html.parser")

            # Finde Matches und deren Quoten
            for match_el in soup.find_all("div", class_=re.compile(r"match|event")):
                text = match_el.get_text().lower()
                if team1.lower() in text and team2.lower() in text:
                    # Tipps-Tendenz aus Quoten-Bewegung erkennen
                    if "1" in text and float(text.split(":")[-1]) < 2.0:
                        return {"expert_consensus": 1, "confidence": 0.7, "source": "tipico"}
                    elif "2" in text and float(text.split(":")[-1]) < 2.0:
                        return {"expert_consensus": 2, "confidence": 0.7, "source": "tipico"}
            return None
        except Exception as e:
            print(f"[DataFetcher] Tipico error: {e}")
            return None

    def get_sky_expert_predictions(self, team1, team2):
        """Scrape Sky Sport Experten-Tipps + Analysen"""
        try:
            # Sky.de hat Match-Analysen
            url = f"https://www.sky.de/fussball/wm-2026/ergebnisse"
            resp = requests.get(url, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }, timeout=10)

            if resp.status_code != 200:
                return None

            soup = BeautifulSoup(resp.content, "html.parser")

            # Suche nach Expertenprognosen
            for section in soup.find_all("section", class_=re.compile(r"expert|prediction|prognose")):
                text = section.get_text().lower()
                if team1.lower() in text and team2.lower() in text:
                    # Extrahiere Tipps-Tendenz
                    if any(w in text for w in ["sieg", "favorit", "gewinnt"]):
                        if team1.lower() in text.split("sieg")[0]:
                            return {"expert_consensus": 1, "confidence": 0.75, "source": "sky"}
                        else:
                            return {"expert_consensus": 2, "confidence": 0.75, "source": "sky"}
            return None
        except Exception as e:
            print(f"[DataFetcher] Sky expert error: {e}")
            return None

    def get_twitter_sentiment(self, team1, team2):
        """Analysiere Twitter/X Sentiment für Match-Prediction"""
        try:
            # Nutze eine öffentliche Twitter-API-Alternative (z.B. tweetscraper)
            # Oder: Suche nach häufigen Hashtags
            search_term = f"{team1} vs {team2} prediction OR tipp OR #wm2026"

            # Falls kein API-Key: Rückgabe ist Fallback
            # Twitter API würde hier sein für offizielle Integration
            return None
        except Exception:
            return None

    def get_team_stats(self, team1, team2=None):
        """Holt Form für beide Teams — ESPN zuerst, dann OpenLigaDB-Fallback"""
        # ESPN Form (primär)
        if team2:
            espn_form = self.get_form_espn(team1, team2)
            if espn_form.get("home_form") != "neutral" or espn_form.get("away_form") != "neutral":
                return espn_form
        # Fallback: alte OpenLigaDB-Methode
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
        return {"form": home_form["form"], "details": home_form, "timestamp": datetime.now().isoformat()}

    def get_expert_predictions(self, team1, team2):
        """Aggregiert Experten-Predictions aus MEHREREN Quellen"""
        print(f"[DataFetcher] Getting expert predictions: {team1} vs {team2}")

        predictions = []

        # 1. ESPN implied probability (schnell, zuverlässig)
        espn_expert = self.get_expert_espn(team1, team2)
        if espn_expert:
            predictions.append(espn_expert)
            print(f"[DataFetcher] ✓ ESPN: consensus={espn_expert['expert_consensus']}, conf={espn_expert['confidence']:.2%}")

        # 2. Reddit
        reddit = self.get_reddit_predictions(team1, team2)
        if reddit:
            predictions.append(reddit)
            print(f"[DataFetcher] ✓ Reddit: consensus={reddit['expert_consensus']}, conf={reddit['confidence']}")

        # 3. Sportschau
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
        weight_sum = 0

        for p in predictions:
            c = p["expert_consensus"]
            conf = p.get("confidence", 0.5)
            if c in [0, 1, 2]:
                consensus_votes[c] += conf
                weight_sum += conf

        if weight_sum == 0:
            return {
                "expert_consensus": -1,
                "confidence": 0.0,
                "source": "none"
            }

        final_consensus = consensus_votes.index(max(consensus_votes))
        final_confidence = max(consensus_votes) / weight_sum

        return {
            "expert_consensus": final_consensus,
            "confidence": round(final_confidence, 3),
            "source": "+".join(p["source"] for p in predictions),
            "sample_size": len(predictions),
            "all_sources": [p["source"] for p in predictions]
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

