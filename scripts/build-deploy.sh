#!/bin/bash
# ============================================================
#  MetalRecovery Pro — skrypt budowania wdrożenia
#  Użycie: bash scripts/build-deploy.sh
#
#  Co robi:
#  1. Buduje frontend (React/Vite) z BASE_PATH=/ dla Cyberfolks
#  2. Kopiuje frontend do deploy/public/
#  3. Bundluje serwer API (passenger.ts) do deploy/server.js
#  4. Aktualizuje datę w deploy/README.md
#
#  Po wykonaniu: zrób git commit + push (lub poczekaj
#  na automatyczny checkpoint Replita)
# ============================================================
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo ""
echo "======================================================"
echo "  MetalRecovery Pro — build dla Cyberfolks"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "======================================================"
echo ""

# ── 1. Zbuduj frontend ──────────────────────────────────────
echo "[1/3] Budowanie frontendu (Vite + PWA) ..."
BASE_PATH=/ pnpm --filter @workspace/metals-calculator run build

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

# ── Podsumowanie ─────────────────────────────────────────────
echo ""
echo "======================================================"
echo "  GOTOWE! Folder deploy/ jest aktualny."
echo ""
echo "  Zawartość deploy/:"
ls -lh "$ROOT_DIR/deploy/" | grep -v "^total" | grep -v "node_modules"
echo ""
echo "  Aby wdrożyć na Cyberfolks, wykonaj:"
echo "    git add deploy/ && git commit -m 'build: aktualizacja deploy'"
echo "    (lub poczekaj na automatyczny checkpoint Replita)"
echo "======================================================"
echo ""
