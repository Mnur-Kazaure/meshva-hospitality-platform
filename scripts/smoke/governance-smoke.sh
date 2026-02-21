#!/usr/bin/env bash
set -euo pipefail

for bin in curl jq mktemp; do
  if ! command -v "$bin" >/dev/null 2>&1; then
    echo "Missing required binary: $bin" >&2
    exit 1
  fi
done

BASE_URL="${BASE_URL:-http://127.0.0.1:8081/v1}"
TENANT_ID="${TENANT_ID:-11111111-1111-1111-1111-111111111111}"
PROPERTY_ID="${PROPERTY_ID:-22222222-2222-2222-2222-222222222222}"

FRONT_DESK_USER_ID="${FRONT_DESK_USER_ID:-70000000-0000-4000-8000-000000000001}"
MANAGER_USER_ID="${MANAGER_USER_ID:-70000000-0000-4000-8000-000000000002}"
OWNER_USER_ID="${OWNER_USER_ID:-70000000-0000-4000-8000-000000000005}"
PLATFORM_ADMIN_USER_ID="${PLATFORM_ADMIN_USER_ID:-70000000-0000-4000-8000-000000000099}"
SUPPORT_TARGET_USER_ID="${SUPPORT_TARGET_USER_ID:-70000000-0000-4000-8000-000000000007}"

RESERVATION_ID="${RESERVATION_ID:-63000000-0000-4000-8000-000000000002}"
INVOICE_ID="${INVOICE_ID:-67000000-0000-4000-8000-000000000001}"

FRONT_DESK_APPROVAL_PERMS='FRONT_DESK.DISCOUNT_REQUEST,FRONT_DESK.REFUND_REQUEST,FRONT_DESK.OVERRIDE_REQUEST'
MANAGER_APPROVAL_PERMS='MANAGER.OPS_VIEW,MANAGER.APPROVAL_VIEW,MANAGER.DISCOUNT_APPROVE,MANAGER.REFUND_APPROVE,MANAGER.OVERRIDE_APPROVE'
OWNER_PERMS='OWNER.PORTFOLIO_VIEW,OWNER.PROPERTY_VIEW,OWNER.FINANCE_VIEW,OWNER.OPERATIONS_VIEW,OWNER.EXCEPTIONS_VIEW,OWNER.AUDIT_VIEW,OWNER.EXPORT,OWNER.NOTE_CREATE'
PLATFORM_PERMS='PLATFORM_ADMIN.SYSTEM_VIEW,PLATFORM_ADMIN.AUDIT_VIEW,PLATFORM_ADMIN.FEATURE_FLAG_MANAGE,PLATFORM_ADMIN.SUBSCRIPTION_MANAGE,PLATFORM_ADMIN.IMPERSONATE,PLATFORM_ADMIN.USER_RESET'

KEY_PREFIX="governance-$(date +%s)"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT
BODY_FILE="$TMP_DIR/body.json"

assert_eq() {
  local label="$1"
  local actual="$2"
  local expected="$3"
  if [[ "$actual" != "$expected" ]]; then
    echo "ASSERT_FAIL: ${label} (expected=${expected}, actual=${actual})"
    exit 1
  fi
}

assert_non_empty() {
  local label="$1"
  local actual="$2"
  if [[ -z "$actual" || "$actual" == "null" ]]; then
    echo "ASSERT_FAIL: ${label} is empty"
    exit 1
  fi
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

from_date=$(date -u -d '-7 day' +%F)
to_date=$(date -u +%F)
override_expiry=$(date -u -d '+12 hour' --iso-8601=seconds)

echo "[governance] manager approvals flow"

status=$(http_call GET "/properties/${PROPERTY_ID}/manager/overview?date=${to_date}" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "x-user-id: ${MANAGER_USER_ID}" \
  -H "x-permissions: ${MANAGER_APPROVAL_PERMS}")
assert_eq 'manager_overview_status' "$status" '200'

discount_request_payload=$(jq -nc \
  --arg reservationId "$RESERVATION_ID" \
  '{entityType:"RESERVATION",entityId:$reservationId,discountType:"AMOUNT",value:1200,reason:"QA governance discount flow"}')
status=$(http_call POST "/properties/${PROPERTY_ID}/approvals/discount-requests" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "x-user-id: ${FRONT_DESK_USER_ID}" \
  -H "x-permissions: ${FRONT_DESK_APPROVAL_PERMS}" \
  -H "Idempotency-Key: ${KEY_PREFIX}-discount-request" \
  -H 'Content-Type: application/json' \
  --data "$discount_request_payload")
assert_eq 'discount_request_status' "$status" '201'
discount_request_id=$(jq -r '.id // empty' "$BODY_FILE")
assert_non_empty 'discount_request_id' "$discount_request_id"

status=$(http_call POST "/properties/${PROPERTY_ID}/approvals/discount-requests/${discount_request_id}/approve" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "x-user-id: ${MANAGER_USER_ID}" \
  -H "x-permissions: ${MANAGER_APPROVAL_PERMS}" \
  -H "Idempotency-Key: ${KEY_PREFIX}-discount-approve" \
  -H 'Content-Type: application/json' \
  --data '{"note":"QA governance approval"}')
assert_eq 'discount_approve_status' "$status" '201'
assert_eq 'discount_approve_state' "$(jq -r '.status // .request.status // empty' "$BODY_FILE")" 'APPROVED'

override_request_payload=$(jq -nc \
  --arg reservationId "$RESERVATION_ID" \
  '{overrideType:"EXTEND_CONFLICT",entityType:"RESERVATION",entityId:$reservationId,reason:"QA governance override flow",requestedValue:{extraNights:1}}')
status=$(http_call POST "/properties/${PROPERTY_ID}/approvals/override-requests" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "x-user-id: ${FRONT_DESK_USER_ID}" \
  -H "x-permissions: ${FRONT_DESK_APPROVAL_PERMS}" \
  -H "Idempotency-Key: ${KEY_PREFIX}-override-request" \
  -H 'Content-Type: application/json' \
  --data "$override_request_payload")
assert_eq 'override_request_status' "$status" '201'
override_request_id=$(jq -r '.id // empty' "$BODY_FILE")
assert_non_empty 'override_request_id' "$override_request_id"

override_approve_payload=$(jq -nc --arg expiresAt "$override_expiry" '{expiresAt:$expiresAt,note:"QA governance override approve"}')
status=$(http_call POST "/properties/${PROPERTY_ID}/approvals/override-requests/${override_request_id}/approve" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "x-user-id: ${MANAGER_USER_ID}" \
  -H "x-permissions: ${MANAGER_APPROVAL_PERMS}" \
  -H "Idempotency-Key: ${KEY_PREFIX}-override-approve" \
  -H 'Content-Type: application/json' \
  --data "$override_approve_payload")
assert_eq 'override_approve_status' "$status" '201'
assert_eq 'override_approve_state' "$(jq -r '.status // empty' "$BODY_FILE")" 'APPROVED'

refund_request_payload=$(jq -nc \
  --arg invoiceId "$INVOICE_ID" \
  '{invoiceId:$invoiceId,amount:500,reason:"QA governance refund flow"}')
status=$(http_call POST "/properties/${PROPERTY_ID}/approvals/refund-requests" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "x-user-id: ${FRONT_DESK_USER_ID}" \
  -H "x-permissions: ${FRONT_DESK_APPROVAL_PERMS}" \
  -H "Idempotency-Key: ${KEY_PREFIX}-refund-request" \
  -H 'Content-Type: application/json' \
  --data "$refund_request_payload")
assert_eq 'refund_request_status' "$status" '201'
refund_request_id=$(jq -r '.id // empty' "$BODY_FILE")
assert_non_empty 'refund_request_id' "$refund_request_id"

status=$(http_call POST "/properties/${PROPERTY_ID}/approvals/refund-requests/${refund_request_id}/approve" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "x-user-id: ${MANAGER_USER_ID}" \
  -H "x-permissions: ${MANAGER_APPROVAL_PERMS}" \
  -H "Idempotency-Key: ${KEY_PREFIX}-refund-approve" \
  -H 'Content-Type: application/json' \
  --data '{"note":"QA governance refund approval"}')
assert_eq 'refund_approve_status' "$status" '201'
assert_eq 'refund_approve_state' "$(jq -r '.status // empty' "$BODY_FILE")" 'APPROVED'

echo "[governance] owner reporting + risk center"

for path in \
  "/owner/overview?from=${from_date}&to=${to_date}" \
  "/owner/properties?from=${from_date}&to=${to_date}" \
  "/owner/financial-summary?from=${from_date}&to=${to_date}" \
  "/owner/operations-summary?from=${from_date}&to=${to_date}" \
  "/owner/audit?from=${from_date}&to=${to_date}&limit=20"
do
  status=$(http_call GET "$path" \
    -H "x-tenant-id: ${TENANT_ID}" \
    -H "x-user-id: ${OWNER_USER_ID}" \
    -H "x-permissions: ${OWNER_PERMS}")
  assert_eq "owner_endpoint_${path}_status" "$status" '200'
done

status=$(http_call GET "/owner/exceptions?from=${from_date}&to=${to_date}" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "x-user-id: ${OWNER_USER_ID}" \
  -H "x-permissions: ${OWNER_PERMS}")
assert_eq 'owner_exceptions_status' "$status" '200'

exception_id=$(jq -r '.exceptions[0].id // empty' "$BODY_FILE")
if [[ -n "$exception_id" ]]; then
  status=$(http_call POST "/owner/exceptions/${exception_id}/ack" \
    -H "x-tenant-id: ${TENANT_ID}" \
    -H "x-user-id: ${OWNER_USER_ID}" \
    -H "x-permissions: ${OWNER_PERMS}" \
    -H "Idempotency-Key: ${KEY_PREFIX}-owner-ack")
  assert_eq 'owner_exception_ack_status' "$status" '201'

  owner_note_payload=$(jq -nc '{text:"QA governance owner note"}')
  status=$(http_call POST "/owner/exceptions/${exception_id}/note" \
    -H "x-tenant-id: ${TENANT_ID}" \
    -H "x-user-id: ${OWNER_USER_ID}" \
    -H "x-permissions: ${OWNER_PERMS}" \
    -H "Idempotency-Key: ${KEY_PREFIX}-owner-note" \
    -H 'Content-Type: application/json' \
    --data "$owner_note_payload")
  assert_eq 'owner_exception_note_status' "$status" '201'
fi

owner_export_payload=$(jq -nc \
  --arg from "$from_date" \
  --arg to "$to_date" \
  '{exportType:"DAILY_CLOSE_COMPLIANCE",from:$from,to:$to,format:"CSV"}')
status=$(http_call POST '/owner/exports' \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "x-user-id: ${OWNER_USER_ID}" \
  -H "x-permissions: ${OWNER_PERMS}" \
  -H "Idempotency-Key: ${KEY_PREFIX}-owner-export" \
  -H 'Content-Type: application/json' \
  --data "$owner_export_payload")
assert_eq 'owner_export_create_status' "$status" '201'
owner_export_id=$(jq -r '.id // empty' "$BODY_FILE")
assert_non_empty 'owner_export_id' "$owner_export_id"

status=$(http_call GET "/owner/exports/${owner_export_id}" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "x-user-id: ${OWNER_USER_ID}" \
  -H "x-permissions: ${OWNER_PERMS}")
assert_eq 'owner_export_get_status' "$status" '200'

echo "[governance] platform admin governance + support tools"

status=$(http_call GET '/platform/system/health' \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "x-user-id: ${PLATFORM_ADMIN_USER_ID}" \
  -H "x-permissions: ${PLATFORM_PERMS}")
assert_eq 'platform_health_status' "$status" '200'

status=$(http_call GET "/platform/audit?from=${from_date}&to=${to_date}&limit=20" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "x-user-id: ${PLATFORM_ADMIN_USER_ID}" \
  -H "x-permissions: ${PLATFORM_PERMS}")
assert_eq 'platform_audit_status' "$status" '200'

status=$(http_call GET '/platform/tenants' \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "x-user-id: ${PLATFORM_ADMIN_USER_ID}" \
  -H "x-permissions: ${PLATFORM_PERMS}")
assert_eq 'platform_tenants_list_status' "$status" '200'
tenant_present=$(jq -r --arg tenantId "$TENANT_ID" 'any(.rows[]?; .id == $tenantId)' "$BODY_FILE")
assert_eq 'platform_known_tenant_present' "$tenant_present" 'true'
platform_tenant_id="$TENANT_ID"

status=$(http_call GET "/platform/tenants/${platform_tenant_id}" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "x-user-id: ${PLATFORM_ADMIN_USER_ID}" \
  -H "x-permissions: ${PLATFORM_PERMS}")
assert_eq 'platform_tenant_details_status' "$status" '200'
tenant_properties_count=$(jq -r '.properties | length' "$BODY_FILE")
assert_non_empty 'platform_tenant_properties_count' "$tenant_properties_count"

status=$(http_call GET "/platform/tenants/${platform_tenant_id}/metrics" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "x-user-id: ${PLATFORM_ADMIN_USER_ID}" \
  -H "x-permissions: ${PLATFORM_PERMS}")
assert_eq 'platform_tenant_metrics_status' "$status" '200'

status=$(http_call GET "/platform/tenants/${platform_tenant_id}/feature-flags" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "x-user-id: ${PLATFORM_ADMIN_USER_ID}" \
  -H "x-permissions: ${PLATFORM_PERMS}")
assert_eq 'platform_feature_flags_list_status' "$status" '200'

feature_flag_payload=$(jq -nc '{key:"owner_notes_enabled",enabled:true,config:{source:"qa-governance-smoke"}}')
status=$(http_call POST "/platform/tenants/${platform_tenant_id}/feature-flags" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "x-user-id: ${PLATFORM_ADMIN_USER_ID}" \
  -H "x-permissions: ${PLATFORM_PERMS}" \
  -H "Idempotency-Key: ${KEY_PREFIX}-feature-flag" \
  -H 'Content-Type: application/json' \
  --data "$feature_flag_payload")
assert_eq 'platform_feature_flag_upsert_status' "$status" '201'

status=$(http_call GET '/platform/subscription-plans' \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "x-user-id: ${PLATFORM_ADMIN_USER_ID}" \
  -H "x-permissions: ${PLATFORM_PERMS}")
assert_eq 'platform_subscription_plans_status' "$status" '200'
subscription_plan_id=$(jq -r --argjson required "$tenant_properties_count" '.[] | select((.isActive == true) and (.propertyLimit >= $required)) | .id' "$BODY_FILE" | head -n1)
if [[ -z "$subscription_plan_id" ]]; then
  subscription_plan_id=$(jq -r '.[0].id // empty' "$BODY_FILE")
fi
assert_non_empty 'platform_subscription_plan_id' "$subscription_plan_id"

assign_plan_payload=$(jq -nc --arg subscriptionPlanId "$subscription_plan_id" --arg effectiveFrom "$to_date" '{subscriptionPlanId:$subscriptionPlanId,effectiveFrom:$effectiveFrom}')
status=$(http_call POST "/platform/tenants/${platform_tenant_id}/assign-plan" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "x-user-id: ${PLATFORM_ADMIN_USER_ID}" \
  -H "x-permissions: ${PLATFORM_PERMS}" \
  -H "Idempotency-Key: ${KEY_PREFIX}-assign-plan" \
  -H 'Content-Type: application/json' \
  --data "$assign_plan_payload")
assert_eq 'platform_assign_plan_status' "$status" '201'

impersonate_payload=$(jq -nc --arg targetUserId "$SUPPORT_TARGET_USER_ID" '{targetUserId:$targetUserId,reason:"QA governance smoke impersonation"}')
status=$(http_call POST "/platform/tenants/${platform_tenant_id}/impersonate" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "x-user-id: ${PLATFORM_ADMIN_USER_ID}" \
  -H "x-permissions: ${PLATFORM_PERMS}" \
  -H "Idempotency-Key: ${KEY_PREFIX}-impersonate" \
  -H 'Content-Type: application/json' \
  --data "$impersonate_payload")
assert_eq 'platform_impersonate_status' "$status" '201'
impersonation_session_id=$(jq -r '.session.id // empty' "$BODY_FILE")
assert_non_empty 'platform_impersonation_session_id' "$impersonation_session_id"

end_impersonation_payload=$(jq -nc '{reason:"QA governance smoke done"}')
status=$(http_call POST "/platform/impersonations/${impersonation_session_id}/end" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "x-user-id: ${PLATFORM_ADMIN_USER_ID}" \
  -H "x-permissions: ${PLATFORM_PERMS}" \
  -H "Idempotency-Key: ${KEY_PREFIX}-impersonate-end" \
  -H 'Content-Type: application/json' \
  --data "$end_impersonation_payload")
assert_eq 'platform_impersonation_end_status' "$status" '201'

reset_password_payload=$(jq -nc '{reason:"QA governance smoke reset"}')
status=$(http_call POST "/platform/users/${SUPPORT_TARGET_USER_ID}/reset-password" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "x-user-id: ${PLATFORM_ADMIN_USER_ID}" \
  -H "x-permissions: ${PLATFORM_PERMS}" \
  -H "Idempotency-Key: ${KEY_PREFIX}-reset-user-password" \
  -H 'Content-Type: application/json' \
  --data "$reset_password_payload")
assert_eq 'platform_reset_password_status' "$status" '201'

echo "GOV_DISCOUNT_REQUEST_ID=${discount_request_id}"
echo "GOV_OVERRIDE_REQUEST_ID=${override_request_id}"
echo "GOV_REFUND_REQUEST_ID=${refund_request_id}"
echo "GOV_OWNER_EXPORT_ID=${owner_export_id}"
echo "GOV_PLATFORM_TENANT_ID=${platform_tenant_id}"
echo "GOV_PLATFORM_IMPERSONATION_ID=${impersonation_session_id}"
echo "GOVERNANCE_CHECK=PASS"
