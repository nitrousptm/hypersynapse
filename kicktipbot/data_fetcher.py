import requests
from bs4 import BeautifulSoup
import re
import json
from datetime import datetime

class DataFetcher:
    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }

    def get_odds_flashscore(self, team1, team2):
        """Scrape odds von Flashscore"""
        try:
            # Flashscore Search URL für Match
            search_url = f"https://www.flashscore.com/search/?q={team1}+vs+{team2}"
            resp = requests.get(search_url, headers=self.headers, timeout=5)

            if resp.status_code != 200:
                return None

            soup = BeautifulSoup(resp.content, 'html.parser')

            # Parse Odds aus Flashscore (1X2 format)
            odds_elements = soup.find_all('span', class_='odds')

            if len(odds_elements) >= 3:
                return {
                    "home": float(odds_elements[0].text),
                    "draw": float(odds_elements[1].text),
                    "away": float(odds_elements[2].text),
                    "source": "flashscore",
                    "timestamp": datetime.now().isoformat()
                }

            return None
        except Exception as e:
            print(f"Error fetching Flashscore odds: {e}")
            return None

    def get_odds_espn(self, team1, team2):
        """Scrape odds von ESPN"""
        try:
            # ESPN Odds Seite
            search_url = f"https://www.espn.com/soccer/match?matchId=0"  # Placeholder
            resp = requests.get(search_url, headers=self.headers, timeout=5)

            if resp.status_code != 200:
                return None

            soup = BeautifulSoup(resp.content, 'html.parser')

            # Parse ESPN odds
            odds_divs = soup.find_all('div', class_='oddsValue')

            if len(odds_divs) >= 3:
                return {
                    "home": float(odds_divs[0].text.split()[-1]),
                    "draw": float(odds_divs[1].text.split()[-1]),
                    "away": float(odds_divs[2].text.split()[-1]),
                    "source": "espn",
                    "timestamp": datetime.now().isoformat()
                }

            return None
        except Exception as e:
            print(f"Error fetching ESPN odds: {e}")
            return None

    def get_odds(self, team1, team2):
        """Holt Quoten von Flashscore oder ESPN"""
        # Versuche Flashscore zuerst
        odds = self.get_odds_flashscore(team1, team2)

        # Fallback zu ESPN
        if not odds:
            odds = self.get_odds_espn(team1, team2)

        # Fallback zu Defaults
        if not odds:
            odds = {
                "home": 2.0,
                "draw": 3.0,
                "away": 3.5,
                "source": "default",
                "timestamp": datetime.now().isoformat()
            }

        return odds

    def get_reddit_predictions(self, team1, team2):
        """Scrape Predictions von r/soccer auf Reddit"""
        try:
            # Reddit Search
            search_url = f"https://www.reddit.com/r/soccer/search/?q={team1}+{team2}&restrict_sr=on&type=post"
            resp = requests.get(search_url, headers=self.headers, timeout=5)

            if resp.status_code != 200:
                return None

            soup = BeautifulSoup(resp.content, 'html.parser')

            # Parse Reddit posts für Sentiment
            posts = soup.find_all('a', class_='_2URML8z6ho6UjiyeFblXrQ')

            sentiments = []
            for post in posts[:5]:  # Top 5 Posts
                text = post.get_text().lower()

                if team1.lower() in text:
                    sentiments.append(1)  # Home Win
                elif team2.lower() in text:
                    sentiments.append(2)  # Away Win
                else:
                    sentiments.append(0)  # Draw

            if sentiments:
                consensus = max(set(sentiments), key=sentiments.count)
                return {
                    "expert_consensus": consensus,
                    "confidence": len(sentiments) / 5.0,
                    "source": "reddit",
                    "sample_size": len(sentiments)
                }

            return None
        except Exception as e:
            print(f"Error fetching Reddit predictions: {e}")
            return None

    def get_sportschau_predictions(self, team1, team2):
        """Scrape Predictions von Sportschau"""
        try:
            # Sportschau Seite
            search_url = f"https://www.sportschau.de/fussball/wm-2026/index.html"
            resp = requests.get(search_url, headers=self.headers, timeout=5)

            if resp.status_code != 200:
                return None

            soup = BeautifulSoup(resp.content, 'html.parser')

            # Parse Sportschau Tipps/Prognosen
            predictions = soup.find_all('div', class_='prediction')

            if predictions:
                return {
                    "expert_consensus": 1,  # Placeholder
                    "confidence": 0.7,
                    "source": "sportschau",
                    "sample_size": len(predictions)
                }

            return None
        except Exception as e:
            print(f"Error fetching Sportschau predictions: {e}")
            return None

    def get_expert_predictions(self, team1, team2):
        """Holt Expertenaussagen von Reddit/Sportschau"""

        # Versuche Reddit zuerst
        expert = self.get_reddit_predictions(team1, team2)

        # Fallback zu Sportschau
        if not expert:
            expert = self.get_sportschau_predictions(team1, team2)

        # Fallback zu Defaults
        if not expert:
            expert = {
                "expert_consensus": 1,
                "confidence": 0.5,
                "source": "default",
                "timestamp": datetime.now().isoformat()
            }

        return expert

    def get_team_stats(self, team):
        """Holt Team-Statistiken"""
        try:
            # Placeholder für Team-Form, Verletzungen, etc.
            return {
                "form": "good",
                "injuries": [],
                "recent_games": [],
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            print(f"Error fetching team stats: {e}")
            return None
