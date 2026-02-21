#!/usr/bin/env bash
set -euo pipefail

DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-meshva_hospitality}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"
RESET_DB="${E2E_DB_RESET:-0}"

if ! command -v pg_isready >/dev/null 2>&1; then
  echo "pg_isready is required." >&2
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required." >&2
  exit 1
fi

echo "[e2e-db] waiting for postgres ${DB_HOST}:${DB_PORT}/${DB_NAME}"
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" >/dev/null 2>&1; do
  sleep 1
done

PSQL=(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1)

if [[ "$RESET_DB" == "1" ]]; then
  echo "[e2e-db] resetting schema public"
  PGPASSWORD="$DB_PASSWORD" "${PSQL[@]}" <<'SQL'
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
SQL
fi

echo "[e2e-db] applying SQL migrations"
while IFS= read -r sql_file; do
  echo "[e2e-db] -> ${sql_file}"
  PGPASSWORD="$DB_PASSWORD" "${PSQL[@]}" -f "$sql_file"
done < <(find apps/core-api/src/database/migrations/sql -maxdepth 1 -type f -name '*.sql' | sort)

echo "[e2e-db] ensuring guest inventory horizon"
DB_HOST="$DB_HOST" \
DB_PORT="$DB_PORT" \
DB_NAME="$DB_NAME" \
DB_USER="$DB_USER" \
DB_PASSWORD="$DB_PASSWORD" \
bash scripts/smoke/seed-pack7-inventory.sh

echo "[e2e-db] bootstrap complete"
