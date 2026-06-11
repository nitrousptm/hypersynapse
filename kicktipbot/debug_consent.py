#!/usr/bin/env python3
"""
Debug-Script: Inspiziert die kicktipp Tippabgabe-Seite und findet
den Consent-Modal-Button (iframes, shadow DOM, etc.)
"""

import time
import sys
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service

CHROMIUM_BINARY = "/usr/bin/chromium"
CHROMEDRIVER_PATH = "/usr/bin/chromedriver"
SCREENSHOT_DIR = "/tmp/kicktipbot_screenshots"

import os, config
os.makedirs(SCREENSHOT_DIR, exist_ok=True)


def make_driver():
    opts = Options()
    opts.binary_location = CHROMIUM_BINARY
    opts.add_argument("--headless=new")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--disable-gpu")
    opts.add_argument("--window-size=1920,1080")
    opts.add_argument("--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/149.0.0.0 Safari/537.36")
    svc = Service(executable_path=CHROMEDRIVER_PATH)
    return webdriver.Chrome(service=svc, options=opts)


def login(driver):
    driver.get("https://www.kicktipp.de/info/profil/login")
    time.sleep(2)

    try:
        email = driver.find_element(By.ID, "kennung")
    except Exception:
        email = driver.find_element(By.CSS_SELECTOR, "input[type='text'],input[type='email']")
    email.send_keys(config.KICKTIPP_EMAIL)

    pwd = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
    pwd.send_keys(config.KICKTIPP_PASSWORD)

    try:
        btn = driver.find_element(By.NAME, "submitbutton")
    except Exception:
        btn = driver.find_element(By.CSS_SELECTOR, "input[type='submit'],button[type='submit']")
    btn.click()
    time.sleep(3)

    if "login" not in driver.current_url.lower():
        print("✓ Login OK:", driver.current_url)
        return True
    print("✗ Login failed")
    return False


def inspect_page(driver, label):
    print(f"\n=== {label} ===")
    print(f"URL: {driver.current_url}")
    print(f"Title: {driver.title}")

    # Alle Buttons auf Hauptseite
    buttons = driver.find_elements(By.TAG_NAME, "button")
    print(f"Buttons auf Hauptseite: {len(buttons)}")
    for b in buttons[:10]:
        try:
            txt = b.text.strip()[:60]
            cls = b.get_attribute("class") or ""
            bid = b.get_attribute("id") or ""
            visible = b.is_displayed()
            print(f"  button: '{txt}' class='{cls[:30]}' id='{bid}' visible={visible}")
        except Exception:
            pass

    # Alle iframes
    iframes = driver.find_elements(By.TAG_NAME, "iframe")
    print(f"\niframes: {len(iframes)}")
    for i, iframe in enumerate(iframes):
        src = iframe.get_attribute("src") or "(no src)"
        name = iframe.get_attribute("name") or ""
        bid = iframe.get_attribute("id") or ""
        print(f"  iframe[{i}]: src='{src[:80]}' name='{name}' id='{bid}'")
        try:
            driver.switch_to.frame(iframe)
            iframe_buttons = driver.find_elements(By.TAG_NAME, "button")
            print(f"    → buttons inside: {len(iframe_buttons)}")
            for b in iframe_buttons[:5]:
                try:
                    txt = b.text.strip()[:60]
                    print(f"      button: '{txt}'")
                except Exception:
                    pass
            driver.switch_to.default_content()
        except Exception as e:
            print(f"    → cannot inspect: {e}")
            driver.switch_to.default_content()

    # Page source Consent-Strings
    src = driver.page_source
    keywords = ["AKZEPTIEREN", "consent", "modal", "cmpbox", "cookiebanner", "privacy-modal"]
    print("\nKeywords in page source:")
    for kw in keywords:
        count = src.lower().count(kw.lower())
        if count:
            print(f"  '{kw}': {count}x")


def try_click_consent(driver):
    print("\n=== Trying to click consent ===")

    # Attempt 1: XPath auf Hauptseite
    for text in ["AKZEPTIEREN", "Akzeptieren", "Accept"]:
        try:
            btn = driver.find_element(By.XPATH, f"//button[contains(., '{text}')]")
            print(f"Found button by XPath '{text}': visible={btn.is_displayed()}")
            if btn.is_displayed():
                btn.click()
                print("✓ Clicked!")
                time.sleep(1)
                driver.save_screenshot(f"{SCREENSHOT_DIR}/debug_after_xpath_click.png")
                return True
        except Exception as e:
            print(f"  XPath '{text}' not found: {e}")

    # Attempt 2: iframes
    iframes = driver.find_elements(By.TAG_NAME, "iframe")
    for i, iframe in enumerate(iframes):
        try:
            driver.switch_to.frame(iframe)
            for text in ["AKZEPTIEREN", "Akzeptieren", "Accept"]:
                try:
                    btn = driver.find_element(By.XPATH, f"//button[contains(., '{text}')]")
                    print(f"✓ Found in iframe[{i}]: '{btn.text}'")
                    btn.click()
                    driver.switch_to.default_content()
                    time.sleep(1)
                    driver.save_screenshot(f"{SCREENSHOT_DIR}/debug_after_iframe_click.png")
                    return True
                except Exception:
                    pass
            driver.switch_to.default_content()
        except Exception as e:
            driver.switch_to.default_content()

    print("✗ No consent button found via any method")
    return False


def main():
    driver = make_driver()
    try:
        if not login(driver):
            return

        tippabgabe_url = f"{config.KICKTIPP_GROUP_URL}/tippabgabe"
        print(f"\nNavigating to {tippabgabe_url}")
        driver.get(tippabgabe_url)
        time.sleep(3)

        driver.save_screenshot(f"{SCREENSHOT_DIR}/debug_initial.png")
        inspect_page(driver, "BEFORE consent")

        clicked = try_click_consent(driver)
        time.sleep(2)

        driver.save_screenshot(f"{SCREENSHOT_DIR}/debug_final_state.png")
        inspect_page(driver, "AFTER consent attempt")

        if clicked:
            print("\n✓ Consent handled - checking for tippabgabe table...")
            inputs = driver.find_elements(By.CSS_SELECTOR, "input[name*='heimTipp'], input[name*='Tipp']")
            print(f"Tipp inputs found: {len(inputs)}")

    finally:
        driver.quit()


if __name__ == "__main__":
    main()
