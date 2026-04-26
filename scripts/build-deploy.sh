#!/bin/bash
# ============================================================
#  MetalRecovery Pro — skrypt budowania i wdrożenia
#  Użycie: bash scripts/build-deploy.sh
#
#  Co robi:
#  1. Buduje frontend (React/Vite) z BASE_PATH=/ dla Cyberfolks
#  2. Kopiuje frontend do deploy/public/
#  3. Bundluje serwer API (passenger.ts) do deploy/server.js
#  4. Jeśli ustawione CYBERFOLKS_SSH_*, wgrywa przez SCP i
#     restartuje serwer automatycznie
# ============================================================
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

SSH_HOST="${CYBERFOLKS_SSH_HOST:-}"
SSH_USER="${CYBERFOLKS_SSH_USER:-}"
SSH_PASS="${CYBERFOLKS_SSH_PASS:-}"
SSH_PORT=222
REMOTE_DIR="~/metalrecovery"
VISION_URL="${VITE_VISION_API_URL:-https://recovery-calculator-bawolekw9.replit.app/api}"

echo ""
echo "======================================================"
echo "  MetalRecovery Pro — build dla Cyberfolks"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "======================================================"
echo ""

# ── 1. Zbuduj frontend ──────────────────────────────────────
echo "[1/3] Budowanie frontendu (Vite + PWA) ..."
VITE_VISION_API_URL="$VISION_URL" BASE_PATH=/ pnpm --filter @workspace/metals-calculator run build

FRONTEND_DIST="$ROOT_DIR/artifacts/metals-calculator/dist/public"
if [ ! -f "$FRONTEND_DIST/index.html" ]; then
  echo "BŁĄD: Brak pliku $FRONTEND_DIST/index.html — build frontendu nie powiódł się"
  exit 1
fi
echo "  ✓ Frontend zbudowany: $FRONTEND_DIST"

# ── 2. Skopiuj frontend do deploy/public/ ───────────────────
echo ""
echo "[2/3] Kopiowanie frontendu do deploy/public/ ..."
rm -rf "$ROOT_DIR/deploy/public"
cp -r "$FRONTEND_DIST" "$ROOT_DIR/deploy/public"
echo "  ✓ deploy/public/ zaktualizowany"

# ── 3. Zbuduj serwer API (passenger.ts → CJS) ───────────────
echo ""
echo "[3/3] Bundlowanie serwera API (passenger.ts → deploy/server.js) ..."
pnpm --filter @workspace/api-server run build:deploy
echo "  ✓ deploy/server.js zaktualizowany"

echo ""
echo "======================================================"
echo "  GOTOWE! Folder deploy/ jest aktualny."
echo ""
echo "  Zawartość deploy/:"
ls -lh "$ROOT_DIR/deploy/" | grep -v "^total" | grep -v "node_modules"
echo "======================================================"
echo ""

# ── 4. Deploy na Cyberfolks przez SSH ───────────────────────
if [ -z "$SSH_HOST" ] || [ -z "$SSH_USER" ] || [ -z "$SSH_PASS" ]; then
  echo "  Pomijam auto-deploy (brak danych SSH)."
  echo "  Wykonaj git pull ręcznie na Cyberfolks."
  echo ""
  exit 0
fi

SSH_OPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=15 -p $SSH_PORT"
SCP_OPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=15 -P $SSH_PORT"

echo "[4/4] Wgrywanie na Cyberfolks ($SSH_USER@$SSH_HOST:$SSH_PORT) ..."
echo ""

echo "  → Wgrywanie server.js (~$(du -sh "$ROOT_DIR/deploy/server.js" | cut -f1)) ..."
sshpass -p "$SSH_PASS" scp $SCP_OPTS \
  "$ROOT_DIR/deploy/server.js" \
  "$SSH_USER@$SSH_HOST:$REMOTE_DIR/server.js"
echo "  ✓ server.js wgrany"

echo "  → Synchronizacja public/ ..."
sshpass -p "$SSH_PASS" ssh $SSH_OPTS "$SSH_USER@$SSH_HOST" \
  "rm -rf $REMOTE_DIR/public && mkdir -p $REMOTE_DIR/public"
sshpass -p "$SSH_PASS" scp $SCP_OPTS -r \
  "$ROOT_DIR/deploy/public/." \
  "$SSH_USER@$SSH_HOST:$REMOTE_DIR/public/"
echo "  ✓ public/ zsynchronizowany"

echo "  → Restart serwera (Passenger restart.txt) ..."
sshpass -p "$SSH_PASS" ssh $SSH_OPTS "$SSH_USER@$SSH_HOST" \
  "mkdir -p $REMOTE_DIR/tmp && date > $REMOTE_DIR/tmp/restart.txt"
echo "  ✓ Serwer zrestartowany"

echo ""
echo "======================================================"
echo "  AUTO-DEPLOY ZAKOŃCZONY POMYŚLNIE!"
echo "  Serwer metalrecovery.online jest już aktualny."
echo "======================================================"
echo ""
