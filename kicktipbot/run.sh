#!/bin/bash
# kicktipbot Starter-Script

echo "🤖 kicktipbot v1.0 - WM 2026 Tipp-Bot"
echo "======================================"

# Check ob .env existiert
if [ ! -f .env ]; then
    echo "❌ .env Datei nicht gefunden!"
    echo "Bitte .env.example kopieren und ausfüllen:"
    echo "  cp .env.example .env"
    exit 1
fi

# Virtual Environment (optional)
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Dependencies checken
python3 -c "import selenium, bs4, requests, dotenv" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "📦 Installing dependencies..."
    pip install -r requirements.txt
fi

# Bot ausführen
echo "🚀 Starting bot..."
python3 main.py

echo "✅ Done!"
