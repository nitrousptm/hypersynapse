#!/bin/bash
# Start kicktipbot Dashboard

echo "🎯 kicktipbot Dashboard"
echo "======================="

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 nicht gefunden"
    exit 1
fi

# Check Dependencies
python3 -c "import flask" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "📦 Installing Flask..."
    pip install flask
fi

# Get local IP
LOCAL_IP=$(hostname -I | awk '{print $1}')
if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP="127.0.0.1"
fi

echo ""
echo "🚀 Starting dashboard..."
echo "   Local:  http://127.0.0.1:5000"
echo "   LAN:    http://$LOCAL_IP:5000"
echo ""
echo "Press Ctrl+C to stop"
echo ""

python3 dashboard.py
