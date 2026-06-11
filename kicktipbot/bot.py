"""
Kicktipp Bot - Selenium-basierte Automation für kicktipp.at
Login + Score-Tipp-Abgabe für WM 2026.
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import time
import config


class KicktippBot:
    """
    Automatisiert kicktipp.at:
    1. Login
    2. Tipps-Seite öffnen
    3. Für jedes Match: Heim- und Auswärts-Tore eintragen
    4. Tipps absenden
    """

    LOGIN_URL = "https://www.kicktipp.at/info/profil/login"
    BASE_URL = "https://www.kicktipp.at"

    def __init__(self):
        options = Options()
        if config.HEADLESS:
            options.add_argument("--headless=new")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--window-size=1920,1080")
        options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

        self.driver = webdriver.Chrome(options=options)
        self.wait = WebDriverWait(self.driver, config.TIMEOUT)
        self.logged_in = False

    def login(self):
        """Logged sich in kicktipp.at ein"""
        try:
            print(f"[Bot] Opening {self.LOGIN_URL}")
            self.driver.get(self.LOGIN_URL)

            # Akzeptiere ggf. Cookie-Banner
            self._accept_cookies()

            # Email-Feld
            email_field = self.wait.until(
                EC.presence_of_element_located((By.ID, "kennung"))
            )
            email_field.clear()
            email_field.send_keys(config.KICKTIPP_EMAIL)

            # Passwort-Feld
            pass_field = self.driver.find_element(By.ID, "passwort")
            pass_field.clear()
            pass_field.send_keys(config.KICKTIPP_PASSWORD)

            # Submit (Login-Button)
            submit_btn = self.driver.find_element(By.NAME, "submitbutton")
            submit_btn.click()

            time.sleep(2)

            # Login erfolgreich? Check URL oder Element
            if "login" not in self.driver.current_url.lower():
                self.logged_in = True
                print("[Bot] ✓ Login successful")
                return True
            else:
                print("[Bot] ✗ Login failed - check credentials")
                return False

        except TimeoutException:
            print("[Bot] ✗ Login timeout - page didn't load")
            return False
        except Exception as e:
            print(f"[Bot] ✗ Login error: {e}")
            return False

    def _accept_cookies(self):
        """Akzeptiert Cookie-Banner falls vorhanden"""
        try:
            # Verschiedene mögliche Cookie-Buttons
            for selector in [
                "button[id*='accept']",
                "button[class*='accept']",
                "button[class*='cookie']",
                "a.cookie-accept",
                "button.cmpboxbtnyes"  # consentmanager.net (häufig auf kicktipp)
            ]:
                try:
                    btn = self.driver.find_element(By.CSS_SELECTOR, selector)
                    if btn.is_displayed():
                        btn.click()
                        time.sleep(0.5)
                        return
                except NoSuchElementException:
                    continue
        except Exception:
            pass

    def open_tippabgabe(self):
        """Öffnet die Tippabgabe-Seite der Gruppe"""
        if not self.logged_in:
            print("[Bot] ✗ Not logged in")
            return False

        try:
            tippabgabe_url = f"{config.KICKTIPP_GROUP_URL}/tippabgabe"
            print(f"[Bot] Opening {tippabgabe_url}")
            self.driver.get(tippabgabe_url)
            time.sleep(2)
            self._accept_cookies()
            return True
        except Exception as e:
            print(f"[Bot] ✗ Error opening tippabgabe: {e}")
            return False

    def get_matches(self):
        """
        Holt alle ausstehenden Matches von der Tippabgabe-Seite.

        Kicktipp-HTML-Struktur (typisch):
        <table id="tippabgabeSpiele">
          <tr>
            <td>Heimteam</td>
            <td>Gastteam</td>
            <td><input name="heimTipp"></td>
            <td><input name="gastTipp"></td>
          </tr>
        </table>
        """
        matches = []
        try:
            # Versuche verschiedene Selectoren (kicktipp hat über die Jahre verschiedene Layouts)
            rows = []

            # Versuch 1: Standard tippabgabe-Tabelle
            try:
                table = self.driver.find_element(By.ID, "tippabgabeSpiele")
                rows = table.find_elements(By.TAG_NAME, "tr")
            except NoSuchElementException:
                pass

            # Versuch 2: Class-basiert
            if not rows:
                rows = self.driver.find_elements(By.CSS_SELECTOR, "tr.tippabgabeSpiel")

            # Versuch 3: Generisch über Input-Felder
            if not rows:
                inputs_home = self.driver.find_elements(By.CSS_SELECTOR, "input[name*='heimTipp']")
                inputs_away = self.driver.find_elements(By.CSS_SELECTOR, "input[name*='gastTipp']")

                for i, (h_input, a_input) in enumerate(zip(inputs_home, inputs_away)):
                    # Team-Namen aus parent row holen
                    try:
                        row = h_input.find_element(By.XPATH, "./ancestor::tr[1]")
                        cells = row.find_elements(By.TAG_NAME, "td")

                        team1 = "Unknown"
                        team2 = "Unknown"
                        for cell in cells:
                            text = cell.text.strip()
                            if text and not text.isdigit() and ":" not in text and "vs" not in text.lower():
                                if team1 == "Unknown":
                                    team1 = text
                                elif team2 == "Unknown":
                                    team2 = text
                                    break

                        matches.append({
                            "team1": team1,
                            "team2": team2,
                            "home_input": h_input,
                            "away_input": a_input,
                            "id": f"match_{i}"
                        })
                    except Exception as e:
                        print(f"[Bot] Error parsing match {i}: {e}")
                        continue

                print(f"[Bot] Found {len(matches)} matches (input-based)")
                return matches

            # Parse rows
            for i, row in enumerate(rows):
                try:
                    cells = row.find_elements(By.TAG_NAME, "td")
                    if len(cells) < 4:
                        continue

                    team1 = cells[1].text.strip() if len(cells) > 1 else "Unknown"
                    team2 = cells[2].text.strip() if len(cells) > 2 else "Unknown"

                    home_input = row.find_element(By.CSS_SELECTOR, "input[name*='heimTipp']")
                    away_input = row.find_element(By.CSS_SELECTOR, "input[name*='gastTipp']")

                    matches.append({
                        "team1": team1,
                        "team2": team2,
                        "home_input": home_input,
                        "away_input": away_input,
                        "id": f"match_{i}"
                    })
                except (NoSuchElementException, IndexError):
                    continue

            print(f"[Bot] Found {len(matches)} matches")
            return matches

        except Exception as e:
            print(f"[Bot] ✗ Error getting matches: {e}")
            return matches

    def place_tip(self, match, home_goals, away_goals):
        """Platziert einen Score-Tipp (z.B. 2:1)"""
        try:
            # Heim-Tore
            home_input = match["home_input"]
            home_input.clear()
            home_input.send_keys(str(home_goals))

            # Auswärts-Tore
            away_input = match["away_input"]
            away_input.clear()
            away_input.send_keys(str(away_goals))

            print(f"[Bot] ✓ Tip placed: {match['team1']} {home_goals}:{away_goals} {match['team2']}")
            return True
        except Exception as e:
            print(f"[Bot] ✗ Error placing tip: {e}")
            return False

    def submit_tips(self):
        """Sendet alle Tipps ab"""
        try:
            # Verschiedene Submit-Button Varianten
            for selector in [
                "input[type='submit'][value*='Tipps']",
                "input[type='submit'][value*='Speichern']",
                "input[type='submit'][value*='Abgeben']",
                "button[type='submit']",
                "input.submit"
            ]:
                try:
                    btn = self.driver.find_element(By.CSS_SELECTOR, selector)
                    if btn.is_displayed():
                        btn.click()
                        time.sleep(2)
                        print("[Bot] ✓ Tips submitted")
                        return True
                except NoSuchElementException:
                    continue

            print("[Bot] ✗ Submit button not found")
            return False
        except Exception as e:
            print(f"[Bot] ✗ Error submitting tips: {e}")
            return False

    def close(self):
        """Schließt Browser"""
        try:
            self.driver.quit()
        except Exception:
            pass
