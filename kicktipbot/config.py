import os
from dotenv import load_dotenv

load_dotenv()

# Kicktipp Login
KICKTIPP_EMAIL = os.getenv("KICKTIPP_EMAIL", "")
KICKTIPP_PASSWORD = os.getenv("KICKTIPP_PASSWORD", "")
KICKTIPP_GROUP_URL = os.getenv("KICKTIPP_GROUP_URL", "")

# Bot Settings
HEADLESS = os.getenv("HEADLESS", "True").lower() == "true"
TIMEOUT = 10
MAX_RETRIES = 3

# Data Sources
ODDS_API_KEY = os.getenv("ODDS_API_KEY", "")  # Optional: api-football.com oder ähnlich
