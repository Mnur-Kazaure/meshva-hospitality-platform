#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:8081/v1}"
PROPERTY_ID="${PROPERTY_ID:-22222222-2222-2222-2222-222222222222}"

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required" >&2
  exit 1
fi

echo "=== BACKEND PRODUCTION READINESS SMOKE ==="
echo "BASE_URL=${BASE_URL}"

connect_status=$(curl -sS -o /tmp/meshva-backend-readiness-connect.json -w '%{http_code}' "${BASE_URL}/public/properties/${PROPERTY_ID}" || true)
if [[ "$connect_status" == "000" ]]; then
  echo "FAIL | API is not reachable at ${BASE_URL}" >&2
  exit 1
fi

echo "STEP 1/7 | Schema authority smoke"
bash scripts/smoke/pack-a-schema-smoke.sh

echo "STEP 2/7 | Auth + RBAC smoke"
bash scripts/smoke/auth-rbac-smoke.sh

echo "STEP 3/7 | Ensure guest inventory horizon"
bash scripts/smoke/seed-pack7-inventory.sh

echo "STEP 4/7 | Guest workflow smoke"
bash scripts/smoke/guest-pack7-smoke.sh

echo "STEP 5/7 | Operations E2E smoke"
bash scripts/smoke/operations-e2e-smoke.sh

echo "STEP 6/7 | Governance smoke"
bash scripts/smoke/governance-smoke.sh

echo "STEP 7/7 | Day 1 onboarding readiness"
bash scripts/ops/day1-onboarding-readiness.sh

echo "RESULT=BACKEND_PRODUCTION_READINESS_PASS"
