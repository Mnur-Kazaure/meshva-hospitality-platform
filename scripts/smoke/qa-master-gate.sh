#!/usr/bin/env bash
set -euo pipefail

for bin in curl jq awk mktemp grep; do
  if ! command -v "$bin" >/dev/null 2>&1; then
    echo "Missing required binary: $bin" >&2
    exit 1
  fi
done

BASE_URL="${BASE_URL:-http://127.0.0.1:8081/v1}"
TENANT_ID="${TENANT_ID:-11111111-1111-1111-1111-111111111111}"
OTHER_TENANT_ID="${OTHER_TENANT_ID:-99999999-9999-4999-8999-999999999999}"
PROPERTY_ID="${PROPERTY_ID:-22222222-2222-2222-2222-222222222222}"
MANAGER_USER_ID="${MANAGER_USER_ID:-70000000-0000-4000-8000-000000000002}"
FRONT_DESK_USER_ID="${FRONT_DESK_USER_ID:-70000000-0000-4000-8000-000000000001}"
GUEST_USER_ID="${GUEST_USER_ID:-8a000000-0000-4000-8000-000000000001}"
ALLOWED_ORIGIN="${ALLOWED_ORIGIN:-http://localhost:3000}"
STAFF_IDENTIFIER="${STAFF_IDENTIFIER:-manager@meshva.com}"
STAFF_PASSWORD="${STAFF_PASSWORD:-Meshva123!}"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT
BODY_FILE="$TMP_DIR/body.json"
HEADER_FILE="$TMP_DIR/headers.txt"
STAFF_COOKIES="$TMP_DIR/staff.cookies"
STALE_COOKIES="$TMP_DIR/stale.cookies"

assert_eq() {
  local label="$1"
  local actual="$2"
  local expected="$3"
  if [[ "$actual" != "$expected" ]]; then
    echo "ASSERT_FAIL: ${label} (expected=${expected}, actual=${actual})"
    exit 1
  fi
}

assert_in() {
  local label="$1"
  local actual="$2"
  local allowed="$3"
  if [[ ",${allowed}," != *",${actual},"* ]]; then
    echo "ASSERT_FAIL: ${label} (actual=${actual}, allowed=${allowed})"
    exit 1
  fi
}

read_cookie() {
  local jar="$1"
  local name="$2"
  awk -v cookie_name="$name" '$0 !~ /^#/ && $6 == cookie_name { print $7 }' "$jar" | tail -n1
}

http_call() {
  local method="$1"
  local path="$2"
  shift 2
  curl -sS \
    -o "$BODY_FILE" \
    -w '%{http_code}' \
    -X "$method" \
    "${BASE_URL}${path}" \
    "$@"
}

echo "=== QA MASTER GATE (PRODUCTION HARDENING) ==="
echo "BASE_URL=${BASE_URL}"

echo "STEP 1/4 | Full backend production readiness suite"
bash scripts/smoke/backend-production-readiness.sh

echo "STEP 2/4 | Observability validation"
REQUEST_ID="qa-master-$(date +%s)"
status=$(curl -sS -D "$HEADER_FILE" -o "$BODY_FILE" -w '%{http_code}' \
  -H "x-request-id: ${REQUEST_ID}" \
  "${BASE_URL}/health")
assert_eq 'health_status' "$status" '200'
assert_eq 'health_body_status' "$(jq -r '.status // empty' "$BODY_FILE")" 'healthy'
echo_header_request_id="$(grep -i '^x-request-id:' "$HEADER_FILE" | tail -n1 | awk '{print $2}' | tr -d '\r')"
assert_eq 'request_id_echo' "$echo_header_request_id" "$REQUEST_ID"

status=$(http_call GET '/ready')
assert_eq 'ready_status' "$status" '200'
assert_eq 'ready_body_status' "$(jq -r '.status // empty' "$BODY_FILE")" 'healthy'

status=$(http_call GET '/metrics')
assert_eq 'metrics_status' "$status" '200'
grep -q 'meshva_http_requests_total' "$BODY_FILE" || {
  echo 'ASSERT_FAIL: metrics_missing_http_counter'
  exit 1
}
grep -q 'meshva_process_uptime_seconds' "$BODY_FILE" || {
  echo 'ASSERT_FAIL: metrics_missing_uptime'
  exit 1
}

echo "STEP 3/4 | Security + isolation negative tests"
status=$(http_call GET "/properties/${PROPERTY_ID}/rooms/board" \
  -H "x-tenant-id: ${OTHER_TENANT_ID}" \
  -H "x-user-id: ${FRONT_DESK_USER_ID}" \
  -H 'x-permissions: FRONT_DESK.RESERVATION_VIEW')
assert_eq 'cross_tenant_access_denied_status' "$status" '403'

status=$(http_call GET "/properties/${PROPERTY_ID}/rooms/board" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "x-user-id: ${GUEST_USER_ID}" \
  -H 'x-permissions: GUEST.BOOKING_VIEW,GUEST.BOOKING_CREATE')
assert_eq 'guest_staff_route_denied_status' "$status" '403'

status=$(http_call GET "/properties/${PROPERTY_ID}/rooms/board" \
  -H "x-user-id: ${FRONT_DESK_USER_ID}" \
  -H 'x-permissions: FRONT_DESK.RESERVATION_VIEW')
assert_eq 'missing_tenant_header_denied_status' "$status" '401'

staff_login_payload=$(jq -nc \
  --arg identifier "$STAFF_IDENTIFIER" \
  --arg password "$STAFF_PASSWORD" \
  '{identifier: $identifier, password: $password}')
status=$(http_call POST '/auth/login' \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H 'Content-Type: application/json' \
  -c "$STAFF_COOKIES" \
  -b "$STAFF_COOKIES" \
  --data "$staff_login_payload")
assert_eq 'staff_login_for_csrf_status' "$status" '201'

status=$(http_call POST '/auth/logout' \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "Origin: ${ALLOWED_ORIGIN}" \
  -b "$STAFF_COOKIES" \
  -c "$STAFF_COOKIES")
assert_eq 'csrf_missing_status' "$status" '403'
assert_eq 'csrf_missing_code' "$(jq -r '.message // empty' "$BODY_FILE")" 'AUTH_CSRF_INVALID'

staff_csrf=$(read_cookie "$STAFF_COOKIES" 'meshva_csrf')
if [[ -z "$staff_csrf" ]]; then
  echo 'ASSERT_FAIL: staff_csrf_cookie_missing'
  exit 1
fi

status=$(http_call POST '/auth/logout' \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "Origin: ${ALLOWED_ORIGIN}" \
  -H "X-CSRF-Token: ${staff_csrf}" \
  -b "$STAFF_COOKIES" \
  -c "$STAFF_COOKIES")
assert_eq 'staff_logout_after_csrf_test_status' "$status" '201'

status=$(http_call POST '/auth/login' \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H 'Content-Type: application/json' \
  -c "$STAFF_COOKIES" \
  -b "$STAFF_COOKIES" \
  --data "$staff_login_payload")
assert_eq 'staff_login_for_refresh_reuse_status' "$status" '201'
cp "$STAFF_COOKIES" "$STALE_COOKIES"

status=$(http_call POST '/auth/refresh' \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "Origin: ${ALLOWED_ORIGIN}" \
  -b "$STAFF_COOKIES" \
  -c "$STAFF_COOKIES")
assert_eq 'refresh_rotation_status' "$status" '201'

status=$(http_call POST '/auth/refresh' \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "Origin: ${ALLOWED_ORIGIN}" \
  -b "$STALE_COOKIES" \
  -c "$STALE_COOKIES")
assert_eq 'refresh_reuse_denied_status' "$status" '401'
assert_in 'refresh_reuse_denied_code' "$(jq -r '.message // empty' "$BODY_FILE")" \
  'AUTH_REFRESH_INVALID,AUTH_REFRESH_REUSE_DETECTED'

current_csrf=$(read_cookie "$STAFF_COOKIES" 'meshva_csrf')
if [[ -n "$current_csrf" ]]; then
  status=$(http_call POST '/auth/logout' \
    -H "x-tenant-id: ${TENANT_ID}" \
    -H "Origin: ${ALLOWED_ORIGIN}" \
    -H "X-CSRF-Token: ${current_csrf}" \
    -b "$STAFF_COOKIES" \
    -c "$STAFF_COOKIES")
  assert_eq 'staff_logout_after_reuse_test_status' "$status" '201'
fi

echo "STEP 4/4 | Mini concurrency stability sanity"
CHECKIN=$(date -u -d '+10 day' +%F)
CHECKOUT=$(date -u -d '+12 day' +%F)
CODES_FILE="$TMP_DIR/search.codes"
: > "$CODES_FILE"
for _ in $(seq 1 20); do
  (
    curl -sS -o /dev/null -w '%{http_code}\n' \
      "${BASE_URL}/public/search?location=Kano&checkIn=${CHECKIN}&checkOut=${CHECKOUT}" \
      -H "x-tenant-id: ${TENANT_ID}" >> "$CODES_FILE"
  ) &
done
wait

non_200_count="$(grep -vc '^200$' "$CODES_FILE" || true)"
assert_eq 'parallel_public_search_non_200_count' "$non_200_count" '0'

echo "QA_MASTER_GATE=PASS"
