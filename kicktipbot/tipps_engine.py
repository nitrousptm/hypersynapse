class TippsEngine:
    """
    Tipps-Engine basierend auf Quoten + Expertenaussagen
    """

    def __init__(self):
        self.weights = {
            "odds": 0.6,
            "expert": 0.3,
            "form": 0.1
        }

    def calculate_tip(self, match_data):
        """
        Berechnet beste Tipps für ein Match
        Returns: 1 (Home Win), 0 (Draw), 2 (Away Win)
        """
        odds = match_data.get("odds", {})
        expert = match_data.get("expert", {})
        form = match_data.get("form", {})

        # Odds-Score: Inverse Quoten (niedrige Quote = höhere Wahrscheinlichkeit)
        odds_score = {
            1: 1 / (odds.get("home", 2.0) or 2.0),
            0: 1 / (odds.get("draw", 3.0) or 3.0),
            2: 1 / (odds.get("away", 3.5) or 3.5)
        }

        # Expert-Score: Consensus (1=Home, 0=Draw, 2=Away)
        expert_consensus = expert.get("expert_consensus", 0)
        expert_confidence = expert.get("confidence", 0.5)

        # Form-Score: +0.1 für gute Form
        form_bonus = 0.1 if form.get("form") == "good" else 0

        # Gesamtscore
        scores = {}
        for outcome in [1, 0, 2]:
            odds_part = odds_score[outcome] * self.weights["odds"]
            expert_part = (1.0 if outcome == expert_consensus else 0.5) * expert_confidence * self.weights["expert"]
            form_part = form_bonus * self.weights["form"] if outcome == 1 else 0

            scores[outcome] = odds_part + expert_part + form_part

        # Best Tip
        best_tip = max(scores, key=scores.get)
        confidence = scores[best_tip]

        return {
            "tip": best_tip,
            "confidence": confidence,
            "scores": scores
        }

    def tip_to_string(self, tip):
        """Konvertiert Tip-Nummer zu Kicktipp-String"""
        mapping = {1: "1", 0: "0", 2: "2"}
        return mapping.get(tip["tip"], "0")
