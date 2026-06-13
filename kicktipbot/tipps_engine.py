"""
Tipps-Engine für Kicktipp WM 2026
- Berechnet optimale Score-Tipps (z.B. 2:1) statt nur 1X2
- Nutzt Poisson-Modell für Tor-Wahrscheinlichkeiten
- Kombiniert Quoten + Experten + Form
"""

import math
from itertools import product

class TippsEngine:
    """
    Optimiert Tipps für Kicktipp WM 2026 Tippspiele.

    Tippspiel-Punkteverteilung (kicktipp Standard):
    - Tendenz richtig (1/X/2): 2 Punkte
    - Tor-Differenz richtig (z.B. 2:1 statt 3:2): 3 Punkte
    - Exaktes Ergebnis: 4 Punkte
    """

    POINTS_TENDENCY = 2
    POINTS_DIFFERENCE = 3
    POINTS_EXACT = 4

    # Realistische Score-Range für Fußball (0-5 Tore pro Team)
    MAX_GOALS = 5

    def __init__(self):
        self.weights = {
            "odds": 0.60,
            "expert": 0.25,
            "form": 0.15
        }

    def odds_to_probabilities(self, odds):
        """Konvertiert 1X2-Quoten zu Wahrscheinlichkeiten (mit Overround-Korrektur)"""
        if not odds:
            return {"home": 0.40, "draw": 0.28, "away": 0.32}

        home = odds.get("home", 2.5)
        draw = odds.get("draw", 3.2)
        away = odds.get("away", 2.8)

        # Inverse Quoten = Roh-Wahrscheinlichkeit
        raw = {
            "home": 1 / home if home > 0 else 0.33,
            "draw": 1 / draw if draw > 0 else 0.33,
            "away": 1 / away if away > 0 else 0.33
        }

        # Overround-Korrektur (Buchmacher-Marge entfernen)
        total = sum(raw.values())
        return {k: v / total for k, v in raw.items()}

    def estimate_expected_goals(self, probabilities, odds=None):
        """
        Schätzt erwartete Tore (Lambda für Poisson) aus 1X2-Wahrscheinlichkeiten.

        Heuristik basiert auf historischen WM/EM-Daten:
        - Klarer Favorit (P_home > 0.65): ~2.2 vs 0.8 Tore
        - Knapper Favorit (P_home > 0.45): ~1.7 vs 1.1 Tore
        - Ausgeglichen: ~1.4 vs 1.3 Tore
        """
        p_home = probabilities["home"]
        p_away = probabilities["away"]

        # Stärke-Differenz bestimmt Tor-Erwartung
        strength_diff = p_home - p_away

        # WM-Durchschnitt: ~2.5 Tore pro Spiel
        avg_goals = 2.5

        # Heim hat Vorteil (~0.1 Tore extra im Schnitt)
        home_boost = 0.1

        # Berechne erwartete Tore
        if strength_diff > 0.30:
            # Klarer Heim-Favorit
            lambda_home = avg_goals * 0.70 + home_boost
            lambda_away = avg_goals * 0.30
        elif strength_diff > 0.10:
            # Leichter Heim-Favorit
            lambda_home = avg_goals * 0.60 + home_boost
            lambda_away = avg_goals * 0.40
        elif strength_diff > -0.10:
            # Ausgeglichen
            lambda_home = avg_goals * 0.52 + home_boost
            lambda_away = avg_goals * 0.48
        elif strength_diff > -0.30:
            # Leichter Auswärts-Favorit
            lambda_home = avg_goals * 0.42 + home_boost
            lambda_away = avg_goals * 0.58
        else:
            # Klarer Auswärts-Favorit
            lambda_home = avg_goals * 0.32 + home_boost
            lambda_away = avg_goals * 0.68

        return lambda_home, lambda_away

    def poisson(self, k, lam):
        """Poisson-Wahrscheinlichkeit für k Tore bei Erwartungswert lam"""
        if lam <= 0:
            return 1.0 if k == 0 else 0.0
        return (lam ** k) * math.exp(-lam) / math.factorial(k)

    def calculate_score_matrix(self, lambda_home, lambda_away):
        """Berechnet Wahrscheinlichkeit für jedes mögliche Ergebnis"""
        matrix = {}
        for h, a in product(range(self.MAX_GOALS + 1), range(self.MAX_GOALS + 1)):
            p = self.poisson(h, lambda_home) * self.poisson(a, lambda_away)
            matrix[(h, a)] = p
        return matrix

    def calculate_expected_points(self, predicted_score, score_matrix):
        """
        Berechnet erwartete Punkte für einen Tipp gegen alle möglichen Ergebnisse.
        Das ist die Schlüsselfunktion: wir wollen den Tipp mit höchstem Erwartungswert!
        """
        ph, pa = predicted_score
        expected_points = 0.0

        for (h, a), prob in score_matrix.items():
            points = 0

            # Exaktes Ergebnis
            if ph == h and pa == a:
                points = self.POINTS_EXACT
            # Tor-Differenz richtig
            elif (ph - pa) == (h - a) and (ph != h or pa != a):
                points = self.POINTS_DIFFERENCE
            # Tendenz richtig
            else:
                pred_tendency = 1 if ph > pa else (0 if ph == pa else 2)
                actual_tendency = 1 if h > a else (0 if h == a else 2)
                if pred_tendency == actual_tendency:
                    points = self.POINTS_TENDENCY

            expected_points += points * prob

        return expected_points

    def find_optimal_score(self, score_matrix):
        """
        Findet das Score-Tipp mit dem höchsten Erwartungswert an Punkten.
        Das ist mathematisch optimal!

        Wichtig: Betrachtet ALLE realistischen Scores, nicht nur konservative (0:0, 1:0, 1:1).
        """
        best_score = (1, 1)
        best_ep = 0.0

        # Berechne Expected Points für ALLE möglichen Scores
        ep_by_score = {}
        for score in score_matrix.keys():
            ep = self.calculate_expected_points(score, score_matrix)
            ep_by_score[score] = ep

            if ep > best_ep:
                best_ep = ep
                best_score = score

        return best_score, best_ep

    def get_top_n_scores(self, score_matrix, n=5):
        """
        Gibt die Top-N Scores nach Expected Points zurück.
        Nützlich für Alternatives + Analyse.
        """
        ep_by_score = {}
        for score in score_matrix.keys():
            ep = self.calculate_expected_points(score, score_matrix)
            ep_by_score[score] = ep

        # Sortiere nach EP
        sorted_scores = sorted(ep_by_score.items(), key=lambda x: x[1], reverse=True)
        return [(score, ep) for score, ep in sorted_scores[:n]]

    def apply_expert_bias(self, lambda_home, lambda_away, expert):
        """Passt Lambda an Expertenkonsens an"""
        if not expert:
            return lambda_home, lambda_away

        consensus = expert.get("expert_consensus", -1)
        confidence = expert.get("confidence", 0.5) * self.weights["expert"]

        if consensus == 1:  # Heim
            lambda_home *= (1 + 0.15 * confidence)
            lambda_away *= (1 - 0.10 * confidence)
        elif consensus == 2:  # Auswärts
            lambda_home *= (1 - 0.10 * confidence)
            lambda_away *= (1 + 0.15 * confidence)
        elif consensus == 0:  # Unentschieden
            avg = (lambda_home + lambda_away) / 2
            lambda_home = lambda_home * 0.85 + avg * 0.15 * confidence
            lambda_away = lambda_away * 0.85 + avg * 0.15 * confidence

        return lambda_home, lambda_away

    def apply_form_bias(self, lambda_home, lambda_away, form):
        """Passt Lambda an Team-Form an"""
        if not form:
            return lambda_home, lambda_away

        form_factor = self.weights["form"]

        home_form = form.get("home_form", "neutral")
        away_form = form.get("away_form", "neutral")

        if home_form == "good":
            lambda_home *= (1 + 0.10 * form_factor)
        elif home_form == "bad":
            lambda_home *= (1 - 0.10 * form_factor)

        if away_form == "good":
            lambda_away *= (1 + 0.10 * form_factor)
        elif away_form == "bad":
            lambda_away *= (1 - 0.10 * form_factor)

        return lambda_home, lambda_away

    def calculate_tip(self, match_data):
        """
        Hauptfunktion: Berechnet optimalen Tipp für ein Match.

        Returns:
        {
            "score": (2, 1),         # Optimaler Tipp
            "score_str": "2:1",       # Als String
            "expected_points": 2.3,    # Erwartete Punkte
            "confidence": 0.65,        # Confidence (0-1)
            "lambda_home": 1.7,        # Erwartete Heim-Tore
            "lambda_away": 0.9,        # Erwartete Auswärts-Tore
            "top_3_alternatives": [...] # Top-3 Alternativen
        }
        """
        odds = match_data.get("odds")
        expert = match_data.get("expert")
        form = match_data.get("form")

        # 1. Quoten → Wahrscheinlichkeiten
        probabilities = self.odds_to_probabilities(odds)

        # 2. Erwartete Tore (Lambda für Poisson)
        lambda_home, lambda_away = self.estimate_expected_goals(probabilities, odds)

        # 3. Experten-Bias anwenden
        lambda_home, lambda_away = self.apply_expert_bias(lambda_home, lambda_away, expert)

        # 4. Form-Bias anwenden
        lambda_home, lambda_away = self.apply_form_bias(lambda_home, lambda_away, form)

        # 5. Score-Matrix berechnen
        score_matrix = self.calculate_score_matrix(lambda_home, lambda_away)

        # 6. Optimalen Tipp finden (max. Erwartungswert an Punkten)
        best_score, best_ep = self.find_optimal_score(score_matrix)

        # 7. Top-3 Alternativen
        all_scores = [(s, self.calculate_expected_points(s, score_matrix))
                      for s in score_matrix.keys()]
        all_scores.sort(key=lambda x: x[1], reverse=True)
        top_3 = [{"score": f"{s[0]}:{s[1]}", "ep": round(ep, 3)}
                 for s, ep in all_scores[:3]]

        # 8. Confidence = Wahrscheinlichkeit des Tipps
        confidence = score_matrix[best_score]

        return {
            "score": best_score,
            "score_str": f"{best_score[0]}:{best_score[1]}",
            "expected_points": round(best_ep, 3),
            "confidence": round(confidence, 4),
            "lambda_home": round(lambda_home, 2),
            "lambda_away": round(lambda_away, 2),
            "top_3_alternatives": top_3
        }

    def tip_to_string(self, tip):
        """Konvertiert Tip-Dict zu Kicktipp-Format"""
        return tip.get("score_str", "1:1")

    def get_home_goals(self, tip):
        return tip["score"][0]

    def get_away_goals(self, tip):
        return tip["score"][1]
