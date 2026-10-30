#!/usr/bin/env bash
# Build on this machine, then upload only the files the server needs to run the app.
#
#   ./scripts/deploy.sh              # lint, build, upload, install and restart on the server
#   DRY_RUN=1 ./scripts/deploy.sh    # lint, build, package, list the upload. No network, nothing uploaded.
#
# Settings come from .deploy.env (see .deploy.env.example).
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ -f .deploy.env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .deploy.env
  set +a
fi

DRY_RUN="${DRY_RUN:-0}"
if [[ "$DRY_RUN" != "1" ]]; then
  : "${VPS_HOST:?Set VPS_HOST in .deploy.env}"
  : "${VPS_USER:?Set VPS_USER in .deploy.env}"
  : "${VPS_APP_DIR:?Set VPS_APP_DIR in .deploy.env}"
fi
VPS_HOST="${VPS_HOST:-}"
VPS_USER="${VPS_USER:-}"
VPS_APP_DIR="${VPS_APP_DIR:-}"
VPS_PORT="${VPS_PORT:-22}"
APP_NAME="${APP_NAME:-slokam}"
APP_PORT="${APP_PORT:-3000}"

TARGET="$VPS_USER@$VPS_HOST"
RELEASE=".release"

echo "==> Lint"
npm run lint

echo "==> Build"
npm run build

echo "==> Package release in $RELEASE/ (only what the server needs to run)"
mkdir -p "$RELEASE/prisma"
rsync -a --delete --exclude 'cache/' .next/ "$RELEASE/.next/"
rsync -a --delete public/ "$RELEASE/public/"
cp package.json package-lock.json next.config.ts ecosystem.config.cjs "$RELEASE/"
cp prisma/schema.prisma "$RELEASE/prisma/"

echo "Files in release:"
(cd "$RELEASE" && find . -type f -not -path './.next/*' | sort)
echo "  .next/ ($(find "$RELEASE/.next" -type f | wc -l | tr -d ' ') files)"

if [[ "$DRY_RUN" == "1" ]]; then
  echo "==> Dry run: release is ready in $RELEASE/. Nothing was uploaded."
  exit 0
fi

echo "==> Upload to $TARGET:$VPS_APP_DIR"
# .env* and the SQLite database are excluded. Excluded files are also protected
# from --delete, so production secrets and data stay on the server.
rsync -az --delete \
  -e "ssh -p $VPS_PORT" \
  --exclude '.env*' \
  --exclude 'node_modules/' \
  --exclude 'prisma/*.db' \
  --exclude 'prisma/*.db-journal' \
  "$RELEASE"/ "$TARGET:$VPS_APP_DIR/"

echo "==> Install, update schema, restart on the server"
ssh -p "$VPS_PORT" "$TARGET" \
  "APP_DIR='$VPS_APP_DIR' APP_NAME='$APP_NAME' APP_PORT='$APP_PORT' bash -l -s" <<'REMOTE'
set -euo pipefail
cd "$APP_DIR"
npm ci --omit=dev
npx prisma generate
npx prisma db push --skip-generate
pm2 startOrRestart ecosystem.config.cjs --only "$APP_NAME" --env production --update-env
pm2 save
sleep 3
curl -sf -o /dev/null "http://127.0.0.1:$APP_PORT/" && echo "App is responding on port $APP_PORT" \
  || { echo "App did not respond on port $APP_PORT. Check: pm2 logs $APP_NAME"; exit 1; }
REMOTE

echo "==> Deployed."
