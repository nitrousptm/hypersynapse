"""
Bonus-Tipp-Submitter für kicktipp.de WM 2026.
Nutzt FIFA-Ranking (aus data_fetcher.py) um optimale Tipps zu setzen.
"""
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import time
import re
import sys
import config

CHROMIUM_BINARY = "/usr/bin/chromium"
CHROMEDRIVER_PATH = "/usr/bin/chromedriver"

# FIFA-Ranking (kleinerer Wert = stärker). Aus data_fetcher.py
RANKING = {
    "argentinien": 1, "argentina": 1,
    "frankreich": 2, "france": 2,
    "spanien": 3, "spain": 3,
    "england": 4,
    "brasilien": 5, "brazil": 5,
    "portugal": 6,
    "niederlande": 7,
    "belgien": 8,
    "deutschland": 9,
    "kroatien": 11,
    "marokko": 12,
    "kolumbien": 13,
    "uruguay": 14,
    "schweiz": 15,
    "usa": 16,
    "japan": 17,
    "senegal": 18,
    "mexiko": 19,
    "österreich": 20,
    "südkorea": 21,
    "türkei": 25,
    "ecuador": 27,
    "kanada": 28,
    "australien": 29, "norwegen": 29,
    "tschechien": 30, "chile": 30,
    "schottland": 31,
    "katar": 32,
    "panama": 33,
    "iran": 34,
    "paraguay": 35,
    "ghana": 37,
    "algerien": 39, "ägypten": 39, "tunesien": 38,
    "elfenbeinküste": 41,
    "saudi-arabien": 42, "dr kongo": 42, "demokratische republik kongo": 42,
    "südafrika": 43,
    "bosnien-herzegowina": 44, "bosnien": 44, "haiti": 45, "jordanien": 44,
    "irak": 40, "kap verde": 46, "curacao": 47, "curaçao": 47,
    "usbekistan": 48, "neuseeland": 48,
}

def rank(team):
    """FIFA-Rang. Unbekannt = 99."""
    return RANKING.get(team.lower().strip(), 99)


def setup_driver():
    options = Options()
    options.binary_location = CHROMIUM_BINARY
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36")
    service = Service(executable_path=CHROMEDRIVER_PATH)
    return webdriver.Chrome(service=service, options=options)


def dismiss_consent(driver):
    """Klicke Consent in iframe(s)."""
    iframes = driver.find_elements(By.TAG_NAME, "iframe")
    for iframe in iframes:
        try:
            driver.switch_to.frame(iframe)
            for b in driver.find_elements(By.XPATH, "//button[contains(., 'AKZEPTIEREN') or contains(., 'Akzeptieren')]"):
                try:
                    b.click()
                    time.sleep(0.3)
                except Exception:
                    pass
            driver.switch_to.default_content()
        except Exception:
            driver.switch_to.default_content()


def login(driver):
    driver.get("https://www.kicktipp.de/info/profil/login")
    time.sleep(2)
    dismiss_consent(driver)
    time.sleep(0.5)
    driver.find_element(By.ID, "kennung").send_keys(config.KICKTIPP_EMAIL)
    driver.find_element(By.ID, "passwort").send_keys(config.KICKTIPP_PASSWORD)
    driver.find_element(By.NAME, "submitbutton").click()
    time.sleep(2)
    return "login" not in driver.current_url.lower()


def select_best_option(sel_elem, exclude_values=None):
    """
    Wählt aus einem <select> die beste Option (niedrigster FIFA-Rang).
    Ignoriert "-- Nicht getippt --" (value=-1).
    `exclude_values`: Liste von value-IDs die nicht ausgewählt werden sollen
        (für Multi-Selects damit nicht 4x dasselbe Team gewählt wird).
    Returns: (gewählter Team-Name, value)
    """
    exclude_values = exclude_values or set()
    options = sel_elem.find_elements(By.TAG_NAME, "option")
    best_team = None
    best_rank = 999
    best_value = None
    for opt in options:
        val = opt.get_attribute("value")
        text = opt.text.strip()
        if val == "-1" or val in exclude_values:
            continue
        r = rank(text)
        if r < best_rank:
            best_rank = r
            best_team = text
            best_value = val
    if best_value is None:
        return None, None
    Select(sel_elem).select_by_value(best_value)
    return best_team, best_value


def fill_bonus_form(driver):
    """Füllt alle Bonus-Frage-Dropdowns auf der aktuellen Seite."""
    fragen_table = driver.find_element(By.ID, "tippabgabeFragen")
    rows = fragen_table.find_elements(By.CLASS_NAME, "datarow")
    print(f"[Bonus] Found {len(rows)} bonus question rows")

    answered = 0
    for i, row in enumerate(rows):
        try:
            # Frage-Text aus row
            row_text = row.text.replace("\n", " ")
            frage_match = re.search(r"([A-ZÄÖÜa-zäöü][^?]{5,200}\?)", row_text)
            frage = frage_match.group(1).strip() if frage_match else f"Row{i}"

            selects = row.find_elements(By.TAG_NAME, "select")
            if not selects:
                continue

            # Multi-Select (z.B. "Wer erreicht das Halbfinale?" hat 4 Selects):
            # Wir wählen für jedes Select das beste verbleibende Team
            used_values = set()
            picks = []
            for sel in selects:
                team, val = select_best_option(sel, exclude_values=used_values)
                if val:
                    used_values.add(val)
                    picks.append(team)
                    answered += 1

            print(f"[Bonus] {frage[:70]}: {', '.join(picks)}")
        except Exception as e:
            print(f"[Bonus] Error row {i}: {e}")

    return answered


def submit_form(driver):
    """Klickt den Submit-Button."""
    selectors = [
        "input[type='submit'][value*='Tipp']",
        "input[type='submit'][value*='speichern' i]",
        "input[type='submit'][value*='abgeben' i]",
        "button[type='submit']",
        "input.submit",
        "input[type='submit']",
    ]
    for sel in selectors:
        try:
            btns = driver.find_elements(By.CSS_SELECTOR, sel)
            for b in btns:
                if b.is_displayed() and b.is_enabled():
                    val = b.get_attribute("value") or b.text
                    print(f"[Submit] Clicking: '{val}'")
                    b.click()
                    time.sleep(3)
                    return True
        except Exception:
            continue
    return False


def main():
    print("="*60)
    print("KICKTIPP BONUS-TIPP SUBMITTER")
    print("="*60)
    driver = setup_driver()
    try:
        print("\n[1] Login...")
        if not login(driver):
            print("LOGIN FAILED")
            return 1
        print("    ✓ Logged in")

        # Bonus-Tab öffnen (default URL leitet dorthin)
        print("\n[2] Opening bonus tab...")
        driver.get(f"{config.KICKTIPP_GROUP_URL}/tippabgabe?bonus=true&spieltagIndex=1")
        time.sleep(3)
        dismiss_consent(driver)
        time.sleep(1)
        driver.save_screenshot("/tmp/kicktipp_bonus_before.png")

        print("\n[3] Filling bonus answers...")
        answered = fill_bonus_form(driver)
        print(f"    → {answered} dropdowns filled")

        driver.save_screenshot("/tmp/kicktipp_bonus_filled.png")

        print("\n[4] Submitting form...")
        if submit_form(driver):
            print("    ✓ Submitted")
        else:
            print("    ✗ Submit failed - searching for submit button manually")
            # Dump all submit-like buttons
            for el in driver.find_elements(By.CSS_SELECTOR, "input, button"):
                t = el.get_attribute("type") or ""
                v = el.get_attribute("value") or el.text or ""
                if t in ("submit", "button") and v:
                    print(f"      {t}: '{v}'")
            return 2

        driver.save_screenshot("/tmp/kicktipp_bonus_after.png")
        print(f"\nFinal URL: {driver.current_url}")
        print(f"Page title: {driver.title}")

        # Check for success message
        body = driver.find_element(By.TAG_NAME, "body").text
        if "Tipp" in body and ("gespeichert" in body.lower() or "abgegeben" in body.lower()):
            print("    ✓ Success message detected")

        return 0
    finally:
        driver.quit()


if __name__ == "__main__":
    sys.exit(main())
