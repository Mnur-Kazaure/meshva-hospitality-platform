#!/usr/bin/env bash
set -euo pipefail

export PORT="${PORT:-8081}"
export PERSISTENCE_MODE="${PERSISTENCE_MODE:-postgres}"
export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@127.0.0.1:5432/meshva_hospitality}"

exec node apps/core-api/dist/apps/core-api/src/main.js
