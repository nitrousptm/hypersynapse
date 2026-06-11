from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import time
import config

class KicktippBot:
    def __init__(self):
        options = webdriver.ChromeOptions()
        if config.HEADLESS:
            options.add_argument("--headless")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        self.driver = webdriver.Chrome(options=options)
        self.wait = WebDriverWait(self.driver, config.TIMEOUT)

    def login(self):
        """Loggt sich in Kicktipp ein"""
        try:
            print("[Bot] Navigating to kicktipp.at...")
            self.driver.get("https://www.kicktipp.at/")

            # Finde Login-Button
            login_btn = self.wait.until(
                EC.element_to_be_clickable((By.XPATH, "//a[contains(text(), 'Anmelden')]"))
            )
            login_btn.click()

            # Email eingeben
            email_field = self.wait.until(
                EC.presence_of_element_located((By.NAME, "email"))
            )
            email_field.send_keys(config.KICKTIPP_EMAIL)

            # Password eingeben
            pass_field = self.driver.find_element(By.NAME, "password")
            pass_field.send_keys(config.KICKTIPP_PASSWORD)

            # Submit
            self.driver.find_element(By.XPATH, "//button[@type='submit']").click()
            time.sleep(3)

            print("[Bot] Login successful!")
            return True

        except TimeoutException:
            print("[Bot] Login timeout!")
            return False
        except Exception as e:
            print(f"[Bot] Login error: {e}")
            return False

    def get_matches(self):
        """Holt alle ausstehenden Matches"""
        try:
            matches = []
            match_elements = self.driver.find_elements(
                By.XPATH, "//div[contains(@class, 'match')]"
            )

            for elem in match_elements:
                try:
                    team1 = elem.find_element(By.CLASS_NAME, "home-team").text
                    team2 = elem.find_element(By.CLASS_NAME, "away-team").text
                    input_id = elem.get_attribute("data-match-id")

                    matches.append({
                        "team1": team1,
                        "team2": team2,
                        "id": input_id,
                        "element": elem
                    })
                except NoSuchElementException:
                    continue

            print(f"[Bot] Found {len(matches)} matches")
            return matches

        except Exception as e:
            print(f"[Bot] Error getting matches: {e}")
            return []

    def place_tip(self, match, tip):
        """Platziert einen Tip"""
        try:
            input_field = match["element"].find_element(By.CLASS_NAME, "tip-input")
            input_field.clear()
            input_field.send_keys(tip)
            print(f"[Bot] Tip placed: {match['team1']} vs {match['team2']} = {tip}")
            return True
        except Exception as e:
            print(f"[Bot] Error placing tip: {e}")
            return False

    def submit_tips(self):
        """Sendet alle Tipps ab"""
        try:
            submit_btn = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Senden')]")
            submit_btn.click()
            time.sleep(2)
            print("[Bot] Tips submitted!")
            return True
        except Exception as e:
            print(f"[Bot] Error submitting tips: {e}")
            return False

    def close(self):
        """Schließt Browser"""
        self.driver.quit()
