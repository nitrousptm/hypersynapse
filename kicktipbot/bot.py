"""
Kicktipp Bot - Selenium-basierte Automation für kicktipp.at
Login + Score-Tipp-Abgabe für WM 2026.
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import time
import config

# Pfade für Chromium auf Debian
CHROMIUM_BINARY = "/usr/bin/chromium"
CHROMEDRIVER_PATH = "/usr/bin/chromedriver"


class KicktippBot:
    """
    Automatisiert kicktipp.at:
    1. Login
    2. Tipps-Seite öffnen
    3. Für jedes Match: Heim- und Auswärts-Tore eintragen
    4. Tipps absenden
    """

    LOGIN_URL = "https://www.kicktipp.de/info/profil/login"
    BASE_URL = "https://www.kicktipp.de"

    def __init__(self):
        options = Options()
        options.binary_location = CHROMIUM_BINARY
        if config.HEADLESS:
            options.add_argument("--headless=new")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--window-size=1920,1080")
        options.add_argument("--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36")
        # Screenshots-Verzeichnis für Debugging
        self.screenshot_dir = "/tmp/kicktipbot_screenshots"
        import os; os.makedirs(self.screenshot_dir, exist_ok=True)

        service = Service(executable_path=CHROMEDRIVER_PATH)
        self.driver = webdriver.Chrome(service=service, options=options)
        self.wait = WebDriverWait(self.driver, config.TIMEOUT)
        self.logged_in = False

    def screenshot(self, name):
        """Macht Screenshot zum Debugging"""
        try:
            path = f"{self.screenshot_dir}/{name}.png"
            self.driver.save_screenshot(path)
            print(f"[Bot] Screenshot: {path}")
        except Exception:
            pass

    def login(self):
        """Logged sich in kicktipp.at ein"""
        try:
            print(f"[Bot] Opening {self.LOGIN_URL}")
            self.driver.get(self.LOGIN_URL)
            time.sleep(2)

            self.screenshot("01_login_page")

            # Akzeptiere ggf. Cookie-Banner
            self._accept_cookies()
            time.sleep(1)

            self.screenshot("02_after_cookies")

            # Email-Feld — kicktipp nutzt 'kennung' als ID
            try:
                email_field = self.wait.until(
                    EC.presence_of_element_located((By.ID, "kennung"))
                )
            except TimeoutException:
                # Fallback: Suche über Name oder Type
                email_field = self.driver.find_element(By.CSS_SELECTOR, "input[type='text'], input[type='email']")

            email_field.clear()
            email_field.send_keys(config.KICKTIPP_EMAIL)

            # Passwort-Feld
            try:
                pass_field = self.driver.find_element(By.ID, "passwort")
            except NoSuchElementException:
                pass_field = self.driver.find_element(By.CSS_SELECTOR, "input[type='password']")

            pass_field.clear()
            pass_field.send_keys(config.KICKTIPP_PASSWORD)

            self.screenshot("03_filled_login")

            # Submit
            try:
                submit_btn = self.driver.find_element(By.NAME, "submitbutton")
            except NoSuchElementException:
                submit_btn = self.driver.find_element(By.CSS_SELECTOR, "input[type='submit'], button[type='submit']")

            submit_btn.click()
            time.sleep(3)

            self.screenshot("04_after_login")

            current_url = self.driver.current_url
            print(f"[Bot] URL after login: {current_url}")

            if "login" not in current_url.lower():
                self.logged_in = True
                print("[Bot] ✓ Login successful")
                return True
            else:
                print("[Bot] ✗ Login failed - wrong credentials or blocked")
                print(f"[Bot] Page title: {self.driver.title}")
                return False

        except TimeoutException:
            self.screenshot("error_login_timeout")
            print("[Bot] ✗ Login timeout")
            return False
        except Exception as e:
            self.screenshot("error_login")
            print(f"[Bot] ✗ Login error: {e}")
            return False

    def _accept_cookies(self):
        """Akzeptiert Cookie/Consent-Banner - mit iframe-Support"""
        # 1. Hauptseite: CSS-Selektoren
        for selector in [
            "button.cmpboxbtnyes",
            "button[id*='accept']",
            "button[class*='accept']",
            "button[class*='consent']",
            "button[class*='cookie']",
            "a.cookie-accept",
        ]:
            try:
                btn = self.driver.find_element(By.CSS_SELECTOR, selector)
                if btn.is_displayed():
                    btn.click()
                    time.sleep(0.5)
                    return
            except NoSuchElementException:
                continue

        # 2. Hauptseite: XPath nach deutschem/englischem Consent-Text
        for text in ["AKZEPTIEREN", "Akzeptieren", "akzeptieren", "Accept", "Zustimmen"]:
            try:
                btn = self.driver.find_element(
                    By.XPATH, f"//button[contains(., '{text}')]"
                )
                if btn.is_displayed():
                    btn.click()
                    time.sleep(0.5)
                    return
            except Exception:
                continue

        # 3. Alle iframes durchsuchen (Cross-Origin-Consent-Dialoge)
        iframes = self.driver.find_elements(By.TAG_NAME, "iframe")
        print(f"[Bot] Scanning {len(iframes)} iframe(s) for consent button")
        for i, iframe in enumerate(iframes):
            try:
                src = iframe.get_attribute("src") or ""
                print(f"[Bot]   iframe[{i}]: {src[:80]}")
                self.driver.switch_to.frame(iframe)
                for text in ["AKZEPTIEREN", "Akzeptieren", "Accept", "Zustimmen"]:
                    try:
                        btn = self.driver.find_element(
                            By.XPATH, f"//button[contains(., '{text}')]"
                        )
                        btn.click()
                        print(f"[Bot] ✓ Consent clicked inside iframe[{i}]")
                        self.driver.switch_to.default_content()
                        time.sleep(1)
                        return
                    except Exception:
                        pass
                self.driver.switch_to.default_content()
            except Exception as e:
                print(f"[Bot]   iframe[{i}] error: {e}")
                self.driver.switch_to.default_content()

        print("[Bot] No consent button found (modal may not be present)")

    def open_tippabgabe(self):
        """Öffnet die Tippabgabe-Seite der Gruppe"""
        if not self.logged_in:
            print("[Bot] ✗ Not logged in")
            return False

        try:
            tippabgabe_url = f"{config.KICKTIPP_GROUP_URL}/tippabgabe"
            print(f"[Bot] Opening {tippabgabe_url}")
            self.driver.get(tippabgabe_url)
            time.sleep(3)

            self.screenshot("tippabgabe_before_consent")
            self._accept_cookies()
            time.sleep(1)
            self.screenshot("tippabgabe_after_consent")

            # Prüfe ob Seite korrekt geladen (nicht mehr Modal)
            page_src = self.driver.page_source
            if "AKZEPTIEREN UND WEITER" in page_src:
                print("[Bot] ⚠ Consent modal still visible after dismiss attempt")
                # Letzter Versuch: direkt per JS auf modal-button klicken
                self.driver.execute_script("""
                    var all = document.querySelectorAll('button, a');
                    for (var el of all) {
                        if (el.textContent && el.textContent.includes('AKZEPTIEREN')) {
                            el.click();
                            break;
                        }
                    }
                """)
                time.sleep(1)
                self.screenshot("tippabgabe_after_js_consent")

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
