#!/usr/bin/env bash
# Idempotent local install: venv + deps. systemd unit install needs sudo;
# you can do that separately with the printed command at the end.

set -euo pipefail

cd "$(dirname "$0")"

if [ ! -d .venv ]; then
    # ensurepip may be unavailable on Debian/Ubuntu minimal — bootstrap manually
    python3 -m venv --without-pip .venv
    curl -sS https://bootstrap.pypa.io/get-pip.py | ./.venv/bin/python
fi

./.venv/bin/pip install --upgrade pip -q
./.venv/bin/pip install -r requirements.txt -q

echo
echo "Local install OK."
echo
echo "Run in foreground:"
echo "    ./.venv/bin/uvicorn server:app --host 0.0.0.0 --port 8088"
echo
echo "Install as systemd service (needs sudo):"
echo "    sudo cp systemd/hypersynapse-dashboard.service /etc/systemd/system/"
echo "    sudo systemctl daemon-reload"
echo "    sudo systemctl enable --now hypersynapse-dashboard"
echo "    sudo systemctl status hypersynapse-dashboard"
echo
echo "LAN URL:  http://192.168.0.14:8088/"
