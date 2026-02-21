#!/usr/bin/env bash
set -euo pipefail

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required." >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required." >&2
  exit 1
fi

BASE_URL="${BASE_URL:-http://127.0.0.1:8081/v1}"
TENANT_ID="${TENANT_ID:-11111111-1111-1111-1111-111111111111}"
PROPERTY_ID="${PROPERTY_ID:-22222222-2222-2222-2222-222222222222}"

PLATFORM_ADMIN_USER_ID="${PLATFORM_ADMIN_USER_ID:-70000000-0000-4000-8000-000000000099}"
MANAGER_USER_ID="${MANAGER_USER_ID:-70000000-0000-4000-8000-000000000002}"
FRONT_DESK_USER_ID="${FRONT_DESK_USER_ID:-70000000-0000-4000-8000-000000000001}"
FINANCE_USER_ID="${FINANCE_USER_ID:-70000000-0000-4000-8000-000000000003}"
HOUSEKEEPING_USER_ID="${HOUSEKEEPING_USER_ID:-70000000-0000-4000-8000-000000000004}"

PLATFORM_ADMIN_PERMS="${PLATFORM_ADMIN_PERMS:-PLATFORM_ADMIN.SYSTEM_VIEW,PLATFORM_ADMIN.FEATURE_FLAG_MANAGE}"
MANAGER_PERMS="${MANAGER_PERMS:-MANAGER.OPS_VIEW}"
FRONT_DESK_PERMS="${FRONT_DESK_PERMS:-FRONT_DESK.RESERVATION_VIEW}"
FINANCE_PERMS="${FINANCE_PERMS:-FINANCE.REPORT_VIEW,FINANCE.PAYMENT_VIEW}"
HOUSEKEEPING_PERMS="${HOUSEKEEPING_PERMS:-HOUSEKEEPING.TASK_VIEW}"

TODAY="$(date -u +%F)"
YESTERDAY="$(date -u -d 'yesterday' +%F)"

PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0
API_STATUS=""
API_BODY=""

log_pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  echo "PASS | $1"
}

log_fail() {
  FAIL_COUNT=$((FAIL_COUNT + 1))
  echo "FAIL | $1"
}

log_warn() {
  WARN_COUNT=$((WARN_COUNT + 1))
  echo "WARN | $1"
}

api_get() {
  local path="$1"
  local user_id="$2"
  local permissions="$3"
  local response
  local curl_err_file="/tmp/meshva-day1-readiness-curl.err"

  : >"${curl_err_file}"

  response="$(
    curl -s -w '\n%{http_code}' \
      -H "x-tenant-id: ${TENANT_ID}" \
      -H "x-user-id: ${user_id}" \
      -H "x-permissions: ${permissions}" \
      "${BASE_URL}${path}"
    2>"${curl_err_file}" || true
  )"

  if [[ -z "${response}" ]]; then
    API_STATUS="000"
    API_BODY="$(cat "${curl_err_file}" 2>/dev/null || echo 'connection_error')"
    return
  fi

  API_STATUS="${response##*$'\n'}"
  API_BODY="${response%$'\n'*}"
}

echo "=== DAY 1 ONBOARDING + SWITCH-OVER READINESS ==="
echo "BASE_URL=${BASE_URL}"
echo "TENANT_ID=${TENANT_ID}"
echo "PROPERTY_ID=${PROPERTY_ID}"
echo

echo "--- Phase 0: Platform Admin Pre-Deployment ---"
api_get "/platform/tenants/${TENANT_ID}" "${PLATFORM_ADMIN_USER_ID}" "${PLATFORM_ADMIN_PERMS}"
if [[ "${API_STATUS}" != "200" ]]; then
  log_fail "Tenant details endpoint unavailable (status ${API_STATUS})."
else
  tenant_status="$(jq -r '.tenant.status // empty' <<<"${API_BODY}")"
  property_count="$(jq -r '.properties | length' <<<"${API_BODY}")"
  user_count="$(jq -r '.users | length' <<<"${API_BODY}")"
  has_active_subscription="$(jq -r '.activeSubscription != null' <<<"${API_BODY}")"

  [[ "${tenant_status}" == "active" ]] \
    && log_pass "Tenant status is ACTIVE." \
    || log_fail "Tenant status is '${tenant_status}'."

  [[ "${property_count}" -ge 1 ]] \
    && log_pass "Tenant has at least one property (${property_count})." \
    || log_fail "Tenant has no properties."

  [[ "${user_count}" -ge 1 ]] \
    && log_pass "Tenant has staff users (${user_count})." \
    || log_fail "Tenant has no staff users."

  [[ "${has_active_subscription}" == "true" ]] \
    && log_pass "Tenant has active subscription." \
    || log_fail "Tenant has no active subscription."
fi

api_get "/platform/tenants/${TENANT_ID}/feature-flags" "${PLATFORM_ADMIN_USER_ID}" "${PLATFORM_ADMIN_PERMS}"
if [[ "${API_STATUS}" == "200" ]]; then
  flags_count="$(jq -r 'length' <<<"${API_BODY}")"
  if [[ "${flags_count}" -gt 0 ]]; then
    log_pass "Feature flags configured (${flags_count})."
  else
    log_warn "Feature flags endpoint returned empty list."
  fi
else
  log_warn "Feature flags verification skipped (status ${API_STATUS})."
fi

echo
echo "--- Phase 1: Property Configuration Readiness ---"
api_get "/properties/${PROPERTY_ID}/rooms/board" "${FRONT_DESK_USER_ID}" "${FRONT_DESK_PERMS}"
if [[ "${API_STATUS}" == "200" ]]; then
  rooms_count="$(jq -r 'length' <<<"${API_BODY}")"
  [[ "${rooms_count}" -ge 1 ]] \
    && log_pass "Room board is configured (${rooms_count} rooms)." \
    || log_fail "Room board is empty."
else
  log_fail "Room board unavailable for Front Desk (status ${API_STATUS})."
fi

api_get "/properties/${PROPERTY_ID}/manager/overview?date=${TODAY}" "${MANAGER_USER_ID}" "${MANAGER_PERMS}"
if [[ "${API_STATUS}" == "200" ]]; then
  total_rooms="$(jq -r '.occupancy.totalRooms // 0' <<<"${API_BODY}")"
  [[ "${total_rooms}" -ge 1 ]] \
    && log_pass "Manager overview accessible (totalRooms=${total_rooms})." \
    || log_warn "Manager overview accessible but occupancy has zero rooms."
else
  log_fail "Manager overview unavailable (status ${API_STATUS})."
fi

api_get "/properties/${PROPERTY_ID}/finance/overview" "${FINANCE_USER_ID}" "${FINANCE_PERMS}"
if [[ "${API_STATUS}" == "200" ]]; then
  daily_close_status="$(jq -r '.dailyCloseStatus // empty' <<<"${API_BODY}")"
  log_pass "Finance overview accessible (dailyCloseStatus=${daily_close_status})."
else
  log_fail "Finance overview unavailable (status ${API_STATUS})."
fi

api_get "/properties/${PROPERTY_ID}/housekeeping/rooms/status-board" "${HOUSEKEEPING_USER_ID}" "${HOUSEKEEPING_PERMS}"
if [[ "${API_STATUS}" == "200" ]]; then
  room_status_count="$(
    jq -r '
      if type == "array" then
        length
      elif (type == "object" and .rooms != null) then
        (.rooms | length)
      else
        0
      end
    ' <<<"${API_BODY}"
  )"
  [[ "${room_status_count}" -ge 1 ]] \
    && log_pass "Housekeeping room status board accessible (${room_status_count} rooms)." \
    || log_warn "Housekeeping board accessible but empty."
else
  log_fail "Housekeeping status board unavailable (status ${API_STATUS})."
fi

echo
echo "--- Phase 2: Current State Capture Signals ---"
api_get "/properties/${PROPERTY_ID}/reservations/today-board" "${FRONT_DESK_USER_ID}" "${FRONT_DESK_PERMS}"
if [[ "${API_STATUS}" == "200" ]]; then
  arrivals="$(jq -r '.today.arrivals | length' <<<"${API_BODY}")"
  departures="$(jq -r '.today.departures | length' <<<"${API_BODY}")"
  in_house="$(jq -r '.today.inHouse | length' <<<"${API_BODY}")"
  log_pass "Today board loaded (arrivals=${arrivals}, departures=${departures}, inHouse=${in_house})."
else
  log_fail "Today board unavailable (status ${API_STATUS})."
fi

api_get "/properties/${PROPERTY_ID}/invoices" "${FINANCE_USER_ID}" "${FINANCE_PERMS}"
if [[ "${API_STATUS}" == "200" ]]; then
  invoice_count="$(jq -r 'length' <<<"${API_BODY}")"
  log_pass "Invoice list loaded (${invoice_count} invoices)."
else
  log_fail "Invoice list unavailable (status ${API_STATUS})."
fi

echo
echo "--- Phase 3: Cut-Over Timing Guard ---"
api_get "/properties/${PROPERTY_ID}/daily-close?date=${YESTERDAY}" "${FINANCE_USER_ID}" "${FINANCE_PERMS}"
if [[ "${API_STATUS}" == "200" ]]; then
  yesterday_locked="$(jq -r '.locked // false' <<<"${API_BODY}")"
  if [[ "${yesterday_locked}" == "true" ]]; then
    log_pass "Previous day (${YESTERDAY}) is locked after daily close."
  else
    log_warn "Previous day (${YESTERDAY}) is not locked yet."
  fi
else
  log_warn "Could not verify previous daily close lock (status ${API_STATUS})."
fi

api_get "/properties/${PROPERTY_ID}/daily-close?date=${TODAY}" "${FINANCE_USER_ID}" "${FINANCE_PERMS}"
if [[ "${API_STATUS}" == "200" ]]; then
  today_status="$(jq -r '.status // empty' <<<"${API_BODY}")"
  if [[ "${today_status}" == "OPEN" ]]; then
    log_pass "Today (${TODAY}) is OPEN for live operations."
  else
    log_warn "Today (${TODAY}) status is ${today_status}."
  fi
else
  log_warn "Could not verify today's close status (status ${API_STATUS})."
fi

echo
echo "--- Manual Cut-Over Controls (Human Gate) ---"
echo "INFO | Confirm old system is READ-ONLY."
echo "INFO | Confirm no dual entry (notebook + Meshva)."
echo "INFO | Confirm manager announcement issued to all shifts."
echo "INFO | Confirm Front Desk + Finance shift handovers submitted."

echo
echo "=== SUMMARY ==="
echo "PASS=${PASS_COUNT}"
echo "WARN=${WARN_COUNT}"
echo "FAIL=${FAIL_COUNT}"

if [[ "${FAIL_COUNT}" -gt 0 ]]; then
  echo "RESULT=BLOCKED"
  exit 1
fi

echo "RESULT=READY_WITH_${WARN_COUNT}_WARNINGS"
