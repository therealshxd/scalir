#!/usr/bin/env bash
# Run the Bulk Image Optimiser (v0.1) dev server in WSL and open the browser.
# Usage:  bash run-wsl.sh
# Needs Node.js in WSL (the script checks and tells you how to install it).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

PORT=5173
URL="http://localhost:${PORT}"

echo "Bulk Image Optimiser — starting in WSL"
echo "Folder: $SCRIPT_DIR"
echo

# 1. Require Node.js
if ! command -v node >/dev/null 2>&1; then
  cat <<'MSG'
Node.js is not installed in WSL. Install it once, then re-run this script.

Recommended (no sudo) — nvm:
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
  exec "$SHELL"          # reload the shell
  nvm install --lts

Or via apt:
  sudo apt update && sudo apt install -y nodejs npm
MSG
  exit 1
fi
echo "Using Node $(node -v) / npm $(npm -v)"

# 2. Install dependencies on first run
if [ ! -d node_modules ]; then
  echo "Installing dependencies (first run only, ~30-60s)…"
  npm install
fi

# 3. Running from the Windows mount? Enable polling so live-reload works.
case "$SCRIPT_DIR" in
  /mnt/*) export CHOKIDAR_USEPOLLING=true ;;
esac

# 4. Open the default Windows browser once the server is up.
open_browser() {
  if command -v explorer.exe >/dev/null 2>&1; then explorer.exe "$URL" >/dev/null 2>&1 || true
  elif command -v wslview     >/dev/null 2>&1; then wslview "$URL"     >/dev/null 2>&1 || true
  else echo "Open $URL in your browser."; fi
}
(
  if command -v curl >/dev/null 2>&1; then
    for _ in $(seq 1 60); do curl -s -o /dev/null "$URL" && break; sleep 1; done
  else
    sleep 8
  fi
  open_browser
) &

# 5. Start Vite (foreground; press Ctrl+C to stop).
echo "Starting dev server at $URL  (Ctrl+C to stop)"
npm run dev -- --port "$PORT" --strictPort
