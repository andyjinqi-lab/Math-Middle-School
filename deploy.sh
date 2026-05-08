#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="/opt/math/app"
BACKUP_ROOT="/opt/math/backups"
API_NAME="${API_NAME:-}"
BRANCH="${1:-main}"
TS="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="${BACKUP_ROOT}/${TS}"
LAST_BACKUP_LINK="${BACKUP_ROOT}/latest"
KEEP_BACKUPS=5

ROLLBACK_READY=0

rollback() {
  local exit_code=$?
  if [[ $ROLLBACK_READY -eq 1 ]]; then
    echo "[rollback] deploy failed, restoring backup: ${BACKUP_DIR}"

    if [[ -d "${BACKUP_DIR}/dist" ]]; then
      rm -rf "${APP_DIR}/dist"
      cp -a "${BACKUP_DIR}/dist" "${APP_DIR}/dist"
    fi

    if [[ -f "${BACKUP_DIR}/.env.production" ]]; then
      cp -f "${BACKUP_DIR}/.env.production" "${APP_DIR}/.env.production"
    fi

    if [[ -n "${API_NAME}" ]]; then
      pm2 restart "${API_NAME}" --update-env || true
    fi
    nginx -t && systemctl reload nginx || true
  fi

  echo "[error] deploy aborted at line ${BASH_LINENO[0]} (exit=${exit_code})"
  exit "${exit_code}"
}
trap rollback ERR

echo "[1/9] enter app dir"
cd "${APP_DIR}"

echo "[2/9] prepare backup dir"
mkdir -p "${BACKUP_DIR}"

echo "[3/9] backup current dist and production env"
if [[ -d dist ]]; then
  cp -a dist "${BACKUP_DIR}/dist"
fi
if [[ -f .env.production ]]; then
  cp -f .env.production "${BACKUP_DIR}/.env.production"
fi
ln -sfn "${BACKUP_DIR}" "${LAST_BACKUP_LINK}"
ROLLBACK_READY=1

echo "[4/9] fetch latest code (${BRANCH})"
git fetch origin "${BRANCH}"
git checkout "${BRANCH}"
git pull origin "${BRANCH}"

echo "[5/9] install deps"
npm install

echo "[6/9] build frontend"
npm run build

echo "[7/9] restart api if API_NAME is configured"
if [[ -n "${API_NAME}" ]]; then
  pm2 restart "${API_NAME}" --update-env
else
  echo "[skip] API_NAME is empty; Math frontend will use VITE_API_* Render endpoints."
fi

echo "[8/9] reload nginx"
nginx -t
systemctl reload nginx

echo "[9/9] health check"
curl -4 -I -m 10 https://math.afinance.site | head -n 1

echo "[cleanup] keep last ${KEEP_BACKUPS} backups"
if [[ -d "${BACKUP_ROOT}" ]]; then
  ls -1dt "${BACKUP_ROOT}"/20* 2>/dev/null | tail -n +$((KEEP_BACKUPS + 1)) | xargs -r rm -rf
fi

echo "Deploy finished. Backup: ${BACKUP_DIR}"
