#!/usr/bin/env bash
set -euo pipefail

for bin in curl jq awk mktemp; do
  if ! command -v "$bin" >/dev/null 2>&1; then
    echo "Missing required binary: $bin" >&2
    exit 1
  fi
done

BASE_URL="${BASE_URL:-http://127.0.0.1:8081/v1}"
TENANT_ID="${TENANT_ID:-11111111-1111-1111-1111-111111111111}"
PROPERTY_ID="${PROPERTY_ID:-22222222-2222-2222-2222-222222222222}"
ROOM_TYPE_ID="${ROOM_TYPE_ID:-33333333-3333-4333-8333-333333333333}"
ALLOWED_ORIGIN="${ALLOWED_ORIGIN:-http://localhost:3000}"

MANAGER_USER_ID="${MANAGER_USER_ID:-70000000-0000-4000-8000-000000000002}"
FRONT_DESK_USER_ID="${FRONT_DESK_USER_ID:-70000000-0000-4000-8000-000000000001}"

STAFF_IDENTIFIER="${STAFF_IDENTIFIER:-manager@meshva.com}"
STAFF_PASSWORD="${STAFF_PASSWORD:-Meshva123!}"
GUEST_IDENTIFIER="${GUEST_IDENTIFIER:-amina.guest@meshva.demo}"
GUEST_PASSWORD="${GUEST_PASSWORD:-Meshva123!}"

KEY_PREFIX="auth-rbac-$(date +%s)"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

BODY_FILE="$TMP_DIR/body.json"
STAFF_COOKIES="$TMP_DIR/staff.cookies"
GUEST_COOKIES="$TMP_DIR/guest.cookies"

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

echo "[auth-rbac] staff login + session lifecycle"

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
assert_eq 'staff_login_status' "$status" '201'

staff_user_id=$(jq -r '.user.id // empty' "$BODY_FILE")
staff_requires_password_change=$(jq -r '.requiresPasswordChange // false' "$BODY_FILE")
if [[ -z "$staff_user_id" ]]; then
  echo 'ASSERT_FAIL: staff_login_user_id_missing'
  exit 1
fi
assert_in 'staff_requires_password_change_boolean' "$staff_requires_password_change" 'true,false'

status=$(http_call GET '/auth/me' \
  -H "x-tenant-id: ${TENANT_ID}" \
  -b "$STAFF_COOKIES" \
  -c "$STAFF_COOKIES")
assert_eq 'staff_me_status' "$status" '200'
assert_eq 'staff_me_user_match' "$(jq -r '.user.id // empty' "$BODY_FILE")" "$staff_user_id"

status=$(http_call POST '/auth/refresh' \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "Origin: ${ALLOWED_ORIGIN}" \
  -b "$STAFF_COOKIES" \
  -c "$STAFF_COOKIES")
assert_eq 'staff_refresh_status' "$status" '201'
assert_eq 'staff_refresh_user_match' "$(jq -r '.user.id // empty' "$BODY_FILE")" "$staff_user_id"

echo "[auth-rbac] invalid credentials + RBAC denial"

bad_login_payload=$(jq -nc \
  --arg identifier "$STAFF_IDENTIFIER" \
  '{identifier: $identifier, password: "invalid-password"}')
status=$(http_call POST '/auth/login' \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H 'Content-Type: application/json' \
  --data "$bad_login_payload")
assert_eq 'invalid_login_status' "$status" '401'
assert_eq 'invalid_login_code' "$(jq -r '.message // empty' "$BODY_FILE")" 'AUTH_INVALID_CREDENTIALS'

status=$(http_call GET '/platform/system/health' \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "x-user-id: ${MANAGER_USER_ID}" \
  -H 'x-permissions: MANAGER.OPS_VIEW')
assert_eq 'manager_denied_platform_health_status' "$status" '403'

echo "[auth-rbac] idempotency enforcement"

check_in=$(date -u -d '+14 day' +%F)
check_out=$(date -u -d '+16 day' +%F)
reservation_payload=$(jq -nc \
  --arg roomTypeId "$ROOM_TYPE_ID" \
  --arg checkIn "$check_in" \
  --arg checkOut "$check_out" \
  '{
    guest: { fullName: "QA Auth Smoke", phone: "+2348050001000" },
    roomTypeId: $roomTypeId,
    checkIn: $checkIn,
    checkOut: $checkOut,
    adults: 1,
    children: 0,
    source: "WALK_IN",
    notes: "auth-rbac smoke idempotency header check",
    depositStatus: "NONE"
  }')

status=$(http_call POST "/properties/${PROPERTY_ID}/reservations" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "x-user-id: ${FRONT_DESK_USER_ID}" \
  -H 'x-permissions: FRONT_DESK.RESERVATION_CREATE' \
  -H 'Content-Type: application/json' \
  --data "$reservation_payload")
assert_eq 'missing_idempotency_status' "$status" '400'
assert_eq 'missing_idempotency_message' "$(jq -r '.message // empty' "$BODY_FILE")" 'Idempotency-Key header is required'

echo "[auth-rbac] staff logout"

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
assert_eq 'staff_logout_status' "$status" '201'
assert_eq 'staff_logout_success' "$(jq -r '.success // empty' "$BODY_FILE")" 'true'

echo "[auth-rbac] guest login + session lifecycle"

guest_login_payload=$(jq -nc \
  --arg identifier "$GUEST_IDENTIFIER" \
  --arg password "$GUEST_PASSWORD" \
  '{identifier: $identifier, password: $password}')

status=$(http_call POST '/guest/auth/login' \
  -H 'Content-Type: application/json' \
  -c "$GUEST_COOKIES" \
  -b "$GUEST_COOKIES" \
  --data "$guest_login_payload")
assert_eq 'guest_login_status' "$status" '201'

guest_id=$(jq -r '.guest.id // empty' "$BODY_FILE")
if [[ -z "$guest_id" ]]; then
  echo 'ASSERT_FAIL: guest_login_guest_id_missing'
  exit 1
fi

status=$(http_call GET '/guest/me' \
  -b "$GUEST_COOKIES" \
  -c "$GUEST_COOKIES")
assert_eq 'guest_me_status' "$status" '200'
assert_eq 'guest_me_id_match' "$(jq -r '.guest.id // empty' "$BODY_FILE")" "$guest_id"

status=$(http_call POST '/guest/auth/refresh' \
  -H "Origin: ${ALLOWED_ORIGIN}" \
  -b "$GUEST_COOKIES" \
  -c "$GUEST_COOKIES")
assert_eq 'guest_refresh_status' "$status" '201'
assert_eq 'guest_refresh_id_match' "$(jq -r '.guest.id // empty' "$BODY_FILE")" "$guest_id"

guest_csrf=$(read_cookie "$GUEST_COOKIES" 'meshva_csrf')
if [[ -z "$guest_csrf" ]]; then
  echo 'ASSERT_FAIL: guest_csrf_cookie_missing'
  exit 1
fi

status=$(http_call POST '/guest/auth/logout' \
  -H "Origin: ${ALLOWED_ORIGIN}" \
  -H "X-CSRF-Token: ${guest_csrf}" \
  -b "$GUEST_COOKIES" \
  -c "$GUEST_COOKIES")
assert_eq 'guest_logout_status' "$status" '201'
assert_eq 'guest_logout_success' "$(jq -r '.success // empty' "$BODY_FILE")" 'true'

echo "AUTH_STAFF_USER_ID=${staff_user_id}"
echo "AUTH_GUEST_ID=${guest_id}"
echo "AUTH_INVALID_LOGIN_CODE=AUTH_INVALID_CREDENTIALS"
echo "AUTH_RBAC_CHECK=PASS"
