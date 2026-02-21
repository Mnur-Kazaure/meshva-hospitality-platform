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
FALLBACK_ROOM_TYPE_ID="${FALLBACK_ROOM_TYPE_ID:-33333333-3333-4333-8333-333333333333}"
OPEN_STAY_ID="${OPEN_STAY_ID:-6d000000-0000-4000-8000-000000000001}"
FALLBACK_INVOICE_ID="${FALLBACK_INVOICE_ID:-67000000-0000-4000-8000-000000000003}"

FRONT_DESK_USER_ID="${FRONT_DESK_USER_ID:-70000000-0000-4000-8000-000000000001}"
MANAGER_USER_ID="${MANAGER_USER_ID:-70000000-0000-4000-8000-000000000002}"
FINANCE_USER_ID="${FINANCE_USER_ID:-70000000-0000-4000-8000-000000000003}"
HOUSEKEEPING_USER_ID="${HOUSEKEEPING_USER_ID:-70000000-0000-4000-8000-000000000004}"
KITCHEN_USER_ID="${KITCHEN_USER_ID:-70000000-0000-4000-8000-000000000007}"

FRONT_DESK_PERMS='FRONT_DESK.RESERVATION_VIEW,FRONT_DESK.RESERVATION_CREATE,FRONT_DESK.STAY_CHECKIN,FRONT_DESK.STAY_CHECKOUT'
MANAGER_PERMS='MANAGER.DAY_UNLOCK'
HOUSEKEEPING_PERMS='HOUSEKEEPING.TASK_VIEW,HOUSEKEEPING.TASK_UPDATE,HOUSEKEEPING.MAINTENANCE_CREATE,HOUSEKEEPING.MAINTENANCE_VIEW'
KITCHEN_PERMS='KITCHEN.MENU_VIEW,KITCHEN.ORDER_VIEW,KITCHEN.ORDER_CREATE,KITCHEN.ORDER_UPDATE_STATUS,KITCHEN.CHARGE_POST'
FINANCE_PERMS='FINANCE.PAYMENT_VIEW,FINANCE.PAYMENT_RECORD,FINANCE.DAILY_CLOSE,FINANCE.REPORT_VIEW'

KEY_PREFIX="ops-e2e-$(date +%s)"

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

assert_float_gt_zero() {
  local label="$1"
  local value="$2"
  awk -v v="$value" 'BEGIN { exit !(v+0 > 0) }' || {
    echo "ASSERT_FAIL: ${label} must be > 0 (actual=${value})"
    exit 1
  }
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

echo "[ops-e2e] ensuring finance day is unlocked for deterministic smoke"

today=$(date -u +%F)
unlock_payload=$(jq -nc --arg date "$today" '{date: $date, reason: "QA smoke precondition unlock"}')
status=$(http_call POST "/properties/${PROPERTY_ID}/day/unlock" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "x-user-id: ${MANAGER_USER_ID}" \
  -H "x-permissions: ${MANAGER_PERMS}" \
  -H "Idempotency-Key: ${KEY_PREFIX}-unlock-pre" \
  -H 'Content-Type: application/json' \
  --data "$unlock_payload")
assert_eq 'day_unlock_pre_status' "$status" '201'

echo "[ops-e2e] discovering available booking window"

room_type_id=''
check_in=''
check_out=''
for offset in $(seq 5 45); do
  check_in=$(date -u -d "+${offset} day" +%F)
  check_out=$(date -u -d "+$((offset + 2)) day" +%F)

  status=$(http_call GET "/public/search?location=Kano&checkIn=${check_in}&checkOut=${check_out}" \
    -H "x-tenant-id: ${TENANT_ID}")
  assert_eq "search_status_offset_${offset}" "$status" '200'

  room_type_id=$(jq -r '.rows[0].availableRoomTypes[0].roomTypeId // empty' "$BODY_FILE")
  if [[ -n "$room_type_id" ]]; then
    break
  fi
done

if [[ -z "$room_type_id" ]]; then
  room_type_id="$FALLBACK_ROOM_TYPE_ID"
fi

status=$(http_call GET "/properties/${PROPERTY_ID}/rooms/board" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "x-user-id: ${FRONT_DESK_USER_ID}" \
  -H "x-permissions: ${FRONT_DESK_PERMS}")
assert_eq 'rooms_board_status' "$status" '200'

room_id=$(jq -r --arg roomTypeId "$room_type_id" '.[] | select(.roomTypeId == $roomTypeId and (.status == "VACANT_READY" or .status == "READY")) | .roomId' "$BODY_FILE" | head -n1)
if [[ -z "$room_id" ]]; then
  room_id=$(jq -r '.[] | select(.status == "VACANT_READY" or .status == "READY") | .roomId' "$BODY_FILE" | head -n1)
fi
assert_non_empty 'room_id_for_checkin' "$room_id"

echo "[ops-e2e] front desk reservation -> checkin -> checkout"

reservation_payload=$(jq -nc \
  --arg roomTypeId "$room_type_id" \
  --arg checkIn "$check_in" \
  --arg checkOut "$check_out" \
  '{
    guest: {
      fullName: "QA Ops Smoke",
      phone: "+2348050002000"
    },
    roomTypeId: $roomTypeId,
    checkIn: $checkIn,
    checkOut: $checkOut,
    adults: 1,
    children: 0,
    source: "WALK_IN",
    notes: "ops-e2e smoke reservation",
    depositStatus: "NONE",
    status: "CONFIRMED"
  }')

status=$(http_call POST "/properties/${PROPERTY_ID}/reservations" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "x-user-id: ${FRONT_DESK_USER_ID}" \
  -H "x-permissions: ${FRONT_DESK_PERMS}" \
  -H "Idempotency-Key: ${KEY_PREFIX}-reservation" \
  -H 'Content-Type: application/json' \
  --data "$reservation_payload")
assert_eq 'reservation_create_status' "$status" '201'

reservation_id=$(jq -r '.id // empty' "$BODY_FILE")
assert_non_empty 'reservation_id' "$reservation_id"

checkin_payload=$(jq -nc --arg reservationId "$reservation_id" --arg assignRoomId "$room_id" '{reservationId: $reservationId, assignRoomId: $assignRoomId}')
status=$(http_call POST "/properties/${PROPERTY_ID}/stays/checkin" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "x-user-id: ${FRONT_DESK_USER_ID}" \
  -H "x-permissions: ${FRONT_DESK_PERMS}" \
  -H "Idempotency-Key: ${KEY_PREFIX}-checkin" \
  -H 'Content-Type: application/json' \
  --data "$checkin_payload")
assert_eq 'checkin_status' "$status" '201'

stay_id=$(jq -r '.id // empty' "$BODY_FILE")
assert_non_empty 'stay_id' "$stay_id"

status=$(http_call POST "/properties/${PROPERTY_ID}/stays/${stay_id}/checkout" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "x-user-id: ${FRONT_DESK_USER_ID}" \
  -H "x-permissions: ${FRONT_DESK_PERMS}" \
  -H "Idempotency-Key: ${KEY_PREFIX}-checkout" \
  -H 'Content-Type: application/json' \
  --data '{"notes":"ops-e2e smoke checkout"}')
assert_eq 'checkout_status' "$status" '201'
assert_eq 'checkout_stay_status' "$(jq -r '.status // empty' "$BODY_FILE")" 'CLOSED'

echo "[ops-e2e] housekeeping task transitions"

status=$(http_call GET "/properties/${PROPERTY_ID}/housekeeping/tasks?status=DIRTY&roomId=${room_id}" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "x-user-id: ${HOUSEKEEPING_USER_ID}" \
  -H "x-permissions: ${HOUSEKEEPING_PERMS}")
assert_eq 'housekeeping_list_dirty_status' "$status" '200'

task_id=$(jq -r '.[0].id // empty' "$BODY_FILE")
assert_non_empty 'housekeeping_task_id' "$task_id"

status=$(http_call POST "/properties/${PROPERTY_ID}/housekeeping/tasks/${task_id}/start" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "x-user-id: ${HOUSEKEEPING_USER_ID}" \
  -H "x-permissions: ${HOUSEKEEPING_PERMS}" \
  -H "Idempotency-Key: ${KEY_PREFIX}-task-start")
assert_eq 'housekeeping_start_status' "$status" '201'
assert_eq 'housekeeping_start_task_status' "$(jq -r '.task.status // empty' "$BODY_FILE")" 'CLEANING'

status=$(http_call POST "/properties/${PROPERTY_ID}/housekeeping/tasks/${task_id}/mark-clean" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "x-user-id: ${HOUSEKEEPING_USER_ID}" \
  -H "x-permissions: ${HOUSEKEEPING_PERMS}" \
  -H "Idempotency-Key: ${KEY_PREFIX}-task-clean")
assert_eq 'housekeeping_mark_clean_status' "$status" '201'
assert_eq 'housekeeping_mark_clean_task_status' "$(jq -r '.task.status // empty' "$BODY_FILE")" 'CLEAN'

status=$(http_call POST "/properties/${PROPERTY_ID}/housekeeping/tasks/${task_id}/mark-ready" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "x-user-id: ${HOUSEKEEPING_USER_ID}" \
  -H "x-permissions: ${HOUSEKEEPING_PERMS}" \
  -H "Idempotency-Key: ${KEY_PREFIX}-task-ready")
assert_eq 'housekeeping_mark_ready_status' "$status" '201'
assert_eq 'housekeeping_mark_ready_task_status' "$(jq -r '.task.status // empty' "$BODY_FILE")" 'READY'

status=$(http_call GET "/properties/${PROPERTY_ID}/housekeeping/rooms/status-board" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "x-user-id: ${HOUSEKEEPING_USER_ID}" \
  -H "x-permissions: ${HOUSEKEEPING_PERMS}")
assert_eq 'housekeeping_status_board_status' "$status" '200'
assert_eq 'housekeeping_room_ready_status' "$(jq -r --arg roomId "$room_id" '.[] | select(.roomId == $roomId) | .roomStatus' "$BODY_FILE")" 'READY'

echo "[ops-e2e] kitchen workflow + folio charge post"

status=$(http_call GET "/properties/${PROPERTY_ID}/kitchen/menu/items" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "x-user-id: ${KITCHEN_USER_ID}" \
  -H "x-permissions: ${KITCHEN_PERMS}")
assert_eq 'kitchen_menu_items_status' "$status" '200'

menu_item_id=$(jq -r '.[] | select(.active == true) | .id' "$BODY_FILE" | head -n1)
assert_non_empty 'kitchen_menu_item_id' "$menu_item_id"

kitchen_order_payload=$(jq -nc \
  --arg stayId "$OPEN_STAY_ID" \
  --arg menuItemId "$menu_item_id" \
  '{
    stayId: $stayId,
    notes: "ops-e2e smoke order",
    items: [
      {
        menuItemId: $menuItemId,
        quantity: 1,
        itemNote: "No onions"
      }
    ]
  }')

status=$(http_call POST "/properties/${PROPERTY_ID}/kitchen/orders" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "x-user-id: ${KITCHEN_USER_ID}" \
  -H "x-permissions: ${KITCHEN_PERMS}" \
  -H "Idempotency-Key: ${KEY_PREFIX}-kitchen-create" \
  -H 'Content-Type: application/json' \
  --data "$kitchen_order_payload")
assert_eq 'kitchen_order_create_status' "$status" '201'
kitchen_order_id=$(jq -r '.id // empty' "$BODY_FILE")
assert_non_empty 'kitchen_order_id' "$kitchen_order_id"
assert_eq 'kitchen_order_initial_status' "$(jq -r '.status // empty' "$BODY_FILE")" 'NEW'

for transition in ACCEPTED IN_PREP READY DELIVERED; do
  status_payload=$(jq -nc --arg toStatus "$transition" '{toStatus: $toStatus}')
  status=$(http_call POST "/properties/${PROPERTY_ID}/kitchen/orders/${kitchen_order_id}/status" \
    -H "x-tenant-id: ${TENANT_ID}" \
    -H "x-user-id: ${KITCHEN_USER_ID}" \
    -H "x-permissions: ${KITCHEN_PERMS}" \
    -H "Idempotency-Key: ${KEY_PREFIX}-kitchen-status-${transition}" \
    -H 'Content-Type: application/json' \
    --data "$status_payload")
  assert_eq "kitchen_status_${transition}_http" "$status" '201'
  assert_eq "kitchen_status_${transition}_value" "$(jq -r '.status // empty' "$BODY_FILE")" "$transition"
done

status=$(http_call POST "/properties/${PROPERTY_ID}/kitchen/orders/${kitchen_order_id}/post-charge" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "x-user-id: ${KITCHEN_USER_ID}" \
  -H "x-permissions: ${KITCHEN_PERMS}" \
  -H "Idempotency-Key: ${KEY_PREFIX}-kitchen-post-charge" \
  -H 'Content-Type: application/json' \
  --data '{"note":"ops-e2e smoke folio post"}')
assert_eq 'kitchen_post_charge_status' "$status" '201'
charge_posted_at=$(jq -r '.chargePostedAt // empty' "$BODY_FILE")
assert_non_empty 'kitchen_charge_posted_at' "$charge_posted_at"

echo "[ops-e2e] finance payment + daily close lock discipline"

status=$(http_call GET "/properties/${PROPERTY_ID}/invoices?status=OPEN" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "x-user-id: ${FINANCE_USER_ID}" \
  -H "x-permissions: ${FINANCE_PERMS}")
assert_eq 'finance_list_open_invoices_status' "$status" '200'

invoice_id=$(jq -r --arg stayId "$OPEN_STAY_ID" '.[] | select(.stayId == $stayId) | .id' "$BODY_FILE" | head -n1)
if [[ -z "$invoice_id" ]]; then
  invoice_id="$FALLBACK_INVOICE_ID"
fi
assert_non_empty 'finance_invoice_id' "$invoice_id"

status=$(http_call GET "/properties/${PROPERTY_ID}/invoices/${invoice_id}" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "x-user-id: ${FINANCE_USER_ID}" \
  -H "x-permissions: ${FINANCE_PERMS}")
assert_eq 'finance_get_invoice_status' "$status" '200'

balance_due=$(jq -r '.ledger.balanceDue // 0' "$BODY_FILE")
if awk -v v="$balance_due" 'BEGIN { exit !(v+0 <= 0) }'; then
  adjustment_payload=$(jq -nc \
    --arg invoiceId "$invoice_id" \
    '{invoiceId: $invoiceId, type: "CHARGE", amount: 1500, description: "ops-e2e outstanding recharge", reason: "qa smoke"}')
  status=$(http_call POST "/properties/${PROPERTY_ID}/invoices/${invoice_id}/adjustments" \
    -H "x-tenant-id: ${TENANT_ID}" \
    -H "x-user-id: ${FINANCE_USER_ID}" \
    -H "x-permissions: ${FINANCE_PERMS}" \
    -H "Idempotency-Key: ${KEY_PREFIX}-finance-adjustment" \
    -H 'Content-Type: application/json' \
    --data "$adjustment_payload")
  assert_eq 'finance_adjustment_status' "$status" '201'

  status=$(http_call GET "/properties/${PROPERTY_ID}/invoices/${invoice_id}" \
    -H "x-tenant-id: ${TENANT_ID}" \
    -H "x-user-id: ${FINANCE_USER_ID}" \
    -H "x-permissions: ${FINANCE_PERMS}")
  assert_eq 'finance_get_invoice_after_adjustment_status' "$status" '200'
  balance_due=$(jq -r '.ledger.balanceDue // 0' "$BODY_FILE")
fi
assert_float_gt_zero 'finance_balance_due' "$balance_due"

payment_amount=$(awk -v balance="$balance_due" 'BEGIN { if (balance > 250) { printf "250" } else { printf "%.2f", balance } }')
payment_payload=$(jq -nc \
  --arg invoiceId "$invoice_id" \
  --arg reference "OPS-E2E-${KEY_PREFIX}" \
  --arg note "ops-e2e smoke payment" \
  --argjson amount "$payment_amount" \
  '{invoiceId: $invoiceId, method: "CASH", amount: $amount, reference: $reference, note: $note}')

status=$(http_call POST "/properties/${PROPERTY_ID}/payments" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "x-user-id: ${FINANCE_USER_ID}" \
  -H "x-permissions: ${FINANCE_PERMS}" \
  -H "Idempotency-Key: ${KEY_PREFIX}-finance-payment" \
  -H 'Content-Type: application/json' \
  --data "$payment_payload")
assert_eq 'finance_record_payment_status' "$status" '201'
outstanding_after_payment=$(jq -r '.outstandingAfter // 0' "$BODY_FILE")

status=$(http_call GET "/properties/${PROPERTY_ID}/daily-close?date=${today}" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "x-user-id: ${FINANCE_USER_ID}" \
  -H "x-permissions: ${FINANCE_PERMS}")
assert_eq 'finance_daily_close_status_before' "$status" '200'
was_locked=$(jq -r '.locked // false' "$BODY_FILE")

if [[ "$was_locked" != 'true' ]]; then
  close_payload=$(jq -nc --arg date "$today" '{date: $date, cashCounted: 0, transferCounted: 0, posCounted: 0, note: "ops-e2e smoke close"}')
  status=$(http_call POST "/properties/${PROPERTY_ID}/daily-close" \
    -H "x-tenant-id: ${TENANT_ID}" \
    -H "x-user-id: ${FINANCE_USER_ID}" \
    -H "x-permissions: ${FINANCE_PERMS}" \
    -H "Idempotency-Key: ${KEY_PREFIX}-daily-close" \
    -H 'Content-Type: application/json' \
    --data "$close_payload")
  assert_eq 'finance_daily_close_post_status' "$status" '201'
fi

status=$(http_call POST "/properties/${PROPERTY_ID}/payments" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "x-user-id: ${FINANCE_USER_ID}" \
  -H "x-permissions: ${FINANCE_PERMS}" \
  -H "Idempotency-Key: ${KEY_PREFIX}-post-close-payment" \
  -H 'Content-Type: application/json' \
  --data "$payment_payload")
if [[ "$status" -lt 400 ]]; then
  echo "ASSERT_FAIL: post_close_payment_expected_failure (status=${status})"
  exit 1
fi

if ! jq -r '.message // ""' "$BODY_FILE" | grep -qi 'locked'; then
  echo "ASSERT_FAIL: post_close_payment_not_locked_reason"
  exit 1
fi

status=$(http_call POST "/properties/${PROPERTY_ID}/day/unlock" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "x-user-id: ${MANAGER_USER_ID}" \
  -H "x-permissions: ${MANAGER_PERMS}" \
  -H "Idempotency-Key: ${KEY_PREFIX}-unlock-post" \
  -H 'Content-Type: application/json' \
  --data "$(jq -nc --arg date "$today" '{date: $date, reason: "QA smoke cleanup unlock"}')")
assert_eq 'day_unlock_cleanup_status' "$status" '201'

echo "OPS_RESERVATION_ID=${reservation_id}"
echo "OPS_STAY_ID=${stay_id}"
echo "OPS_HOUSEKEEPING_TASK_ID=${task_id}"
echo "OPS_KITCHEN_ORDER_ID=${kitchen_order_id}"
echo "OPS_FINANCE_INVOICE_ID=${invoice_id}"
echo "OPS_PAYMENT_OUTSTANDING_AFTER=${outstanding_after_payment}"
echo "OPS_E2E_CHECK=PASS"
