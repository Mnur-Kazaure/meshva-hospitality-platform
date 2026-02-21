#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:8081/v1}"
BASE="${BASE_URL%/}"
TENANT="11111111-1111-1111-1111-111111111111"
PROPERTY="22222222-2222-2222-2222-222222222222"
FALLBACK_ROOM_TYPE="33333333-3333-4333-8333-333333333333"
GUEST_PHONE="+2348099999999"
GUEST_EMAIL="guest.pack7@example.com"
GUEST_PERMS="GUEST.BOOKING_VIEW,GUEST.BOOKING_CREATE,GUEST.BOOKING_MODIFY,GUEST.BOOKING_CANCEL,GUEST.PROFILE_EDIT"
KEY_PREFIX="guest-pack7-$(date +%s)"

DETAILS=$(curl -sS "$BASE/public/properties/${PROPERTY}" -H "x-tenant-id: ${TENANT}")
DETAILS_PROPERTY=$(echo "$DETAILS" | jq -r '.property.name // empty')
ROOM_TYPE=$(echo "$DETAILS" | jq -r '.property.roomTypes[0].id // empty')
if [[ -z "$ROOM_TYPE" ]]; then
  ROOM_TYPE="$FALLBACK_ROOM_TYPE"
fi

SEARCH_COUNT=-1
RESERVATION_ID=""
RESERVATION_ID_2=""
CHECKIN=""
CHECKOUT=""
CHECKOUT_EXT=""

for offset in $(seq 5 90); do
  CHECKIN=$(date -u -d "+${offset} day" +%F)
  CHECKOUT=$(date -u -d "+$((offset+2)) day" +%F)
  CHECKOUT_EXT=$(date -u -d "+$((offset+3)) day" +%F)

  SEARCH=$(curl -sS "$BASE/public/search?location=Kano&checkIn=${CHECKIN}&checkOut=${CHECKOUT}" \
    -H "x-tenant-id: ${TENANT}")
  SEARCH_EXT=$(curl -sS "$BASE/public/search?location=Kano&checkIn=${CHECKIN}&checkOut=${CHECKOUT_EXT}" \
    -H "x-tenant-id: ${TENANT}")
  SEARCH_COUNT=$(echo "$SEARCH" | jq '.count // -1')

  SEARCH_ROOM_TYPES=$(echo "$SEARCH" | jq -r '.rows[0].availableRoomTypes[]?.roomTypeId // empty')
  SEARCH_EXT_ROOM_TYPES=$(echo "$SEARCH_EXT" | jq -r '.rows[0].availableRoomTypes[]?.roomTypeId // empty')

  ROOM_TYPE_CANDIDATE=""
  while IFS= read -r ROOM_TYPE_OPTION; do
    [[ -n "$ROOM_TYPE_OPTION" ]] || continue
    if echo "$SEARCH_EXT_ROOM_TYPES" | grep -Fxq "$ROOM_TYPE_OPTION"; then
      ROOM_TYPE_CANDIDATE="$ROOM_TYPE_OPTION"
      break
    fi
  done <<< "$SEARCH_ROOM_TYPES"

  if [[ -n "$ROOM_TYPE_CANDIDATE" ]]; then
    ROOM_TYPE="$ROOM_TYPE_CANDIDATE"
  else
    continue
  fi

  CREATE_PAYLOAD=$(jq -nc \
    --arg propertyId "$PROPERTY" \
    --arg roomTypeId "$ROOM_TYPE" \
    --arg checkIn "$CHECKIN" \
    --arg checkOut "$CHECKOUT" \
    --arg fullName "Guest Pack7" \
    --arg phone "$GUEST_PHONE" \
    --arg email "$GUEST_EMAIL" \
    '{propertyId:$propertyId,roomTypeId:$roomTypeId,checkIn:$checkIn,checkOut:$checkOut,adults:2,children:0,fullName:$fullName,phone:$phone,email:$email,specialRequest:"Late arrival"}')

  CREATE_ONE=$(curl -sS -X POST "$BASE/guest/bookings/checkout" \
    -H "x-tenant-id: ${TENANT}" \
    -H "x-user-id: 70000000-0000-4000-8000-000000000006" \
    -H "x-guest-phone: ${GUEST_PHONE}" \
    -H "x-permissions: ${GUEST_PERMS}" \
    -H "Idempotency-Key: ${KEY_PREFIX}-create-${offset}" \
    -H "Content-Type: application/json" \
    -d "$CREATE_PAYLOAD")

  RESERVATION_ID=$(echo "$CREATE_ONE" | jq -r '.reservationId // empty')
  if [[ -n "$RESERVATION_ID" ]]; then
    CREATE_TWO=$(curl -sS -X POST "$BASE/guest/bookings/checkout" \
      -H "x-tenant-id: ${TENANT}" \
      -H "x-user-id: 70000000-0000-4000-8000-000000000006" \
      -H "x-guest-phone: ${GUEST_PHONE}" \
      -H "x-permissions: ${GUEST_PERMS}" \
      -H "Idempotency-Key: ${KEY_PREFIX}-create-${offset}" \
      -H "Content-Type: application/json" \
      -d "$CREATE_PAYLOAD")
    RESERVATION_ID_2=$(echo "$CREATE_TWO" | jq -r '.reservationId // empty')
    break
  fi

done

if [[ -z "$RESERVATION_ID" ]]; then
  echo "CREATE_FAILED: no available inventory window found in next 90 days"
  exit 1
fi

LIST_BEFORE=$(curl -sS "$BASE/guest/bookings" \
  -H "x-tenant-id: ${TENANT}" \
  -H "x-user-id: 70000000-0000-4000-8000-000000000006" \
  -H "x-guest-phone: ${GUEST_PHONE}" \
  -H "x-permissions: ${GUEST_PERMS}")

DETAIL_BEFORE=$(curl -sS "$BASE/guest/bookings/${RESERVATION_ID}" \
  -H "x-tenant-id: ${TENANT}" \
  -H "x-user-id: 70000000-0000-4000-8000-000000000006" \
  -H "x-guest-phone: ${GUEST_PHONE}" \
  -H "x-permissions: ${GUEST_PERMS}")

MODIFY_PAYLOAD=$(jq -nc --arg newCheckOut "$CHECKOUT_EXT" '{newCheckOut:$newCheckOut,adults:2,children:1}')
MODIFY=$(curl -sS -X POST "$BASE/guest/bookings/${RESERVATION_ID}/modify" \
  -H "x-tenant-id: ${TENANT}" \
  -H "x-user-id: 70000000-0000-4000-8000-000000000006" \
  -H "x-guest-phone: ${GUEST_PHONE}" \
  -H "x-permissions: ${GUEST_PERMS}" \
  -H "Idempotency-Key: ${KEY_PREFIX}-modify" \
  -H "Content-Type: application/json" \
  -d "$MODIFY_PAYLOAD")

CANCEL=$(curl -sS -X POST "$BASE/guest/bookings/${RESERVATION_ID}/cancel" \
  -H "x-tenant-id: ${TENANT}" \
  -H "x-user-id: 70000000-0000-4000-8000-000000000006" \
  -H "x-guest-phone: ${GUEST_PHONE}" \
  -H "x-permissions: ${GUEST_PERMS}" \
  -H "Idempotency-Key: ${KEY_PREFIX}-cancel" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Plans changed"}')

PROFILE_GET=$(curl -sS "$BASE/guest/profile" \
  -H "x-tenant-id: ${TENANT}" \
  -H "x-user-id: 70000000-0000-4000-8000-000000000006" \
  -H "x-guest-phone: ${GUEST_PHONE}" \
  -H "x-permissions: ${GUEST_PERMS}")

PROFILE_PATCH=$(curl -sS -X PATCH "$BASE/guest/profile" \
  -H "x-tenant-id: ${TENANT}" \
  -H "x-user-id: 70000000-0000-4000-8000-000000000006" \
  -H "x-guest-phone: ${GUEST_PHONE}" \
  -H "x-permissions: ${GUEST_PERMS}" \
  -H "Idempotency-Key: ${KEY_PREFIX}-profile" \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Guest Pack7 Updated"}')

CREATE_IDEMPOTENT_MATCH=$( [ "$RESERVATION_ID" = "$RESERVATION_ID_2" ] && echo true || echo false )
LIST_UPCOMING_COUNT=$(echo "$LIST_BEFORE" | jq '.upcoming | length')
DETAIL_CAN_MODIFY=$(echo "$DETAIL_BEFORE" | jq '.canModify')
MODIFY_NEW_CHECKOUT=$(echo "$MODIFY" | jq -r '.checkOut // empty')
CANCEL_STATUS=$(echo "$CANCEL" | jq -r '.status // empty')
PROFILE_PHONE=$(echo "$PROFILE_GET" | jq -r '.phone // empty')
PROFILE_UPDATED_NAME=$(echo "$PROFILE_PATCH" | jq -r '.fullName // empty')

[[ "$SEARCH_COUNT" -ge 1 ]] || { echo "ASSERT_FAIL: SEARCH_COUNT"; exit 1; }
[[ -n "$DETAILS_PROPERTY" ]] || { echo "ASSERT_FAIL: DETAILS_PROPERTY"; exit 1; }
[[ "$CREATE_IDEMPOTENT_MATCH" == "true" ]] || { echo "ASSERT_FAIL: CREATE_IDEMPOTENT_MATCH"; exit 1; }
[[ "$LIST_UPCOMING_COUNT" -ge 1 ]] || { echo "ASSERT_FAIL: LIST_UPCOMING_COUNT"; exit 1; }
[[ "$DETAIL_CAN_MODIFY" == "true" ]] || { echo "ASSERT_FAIL: DETAIL_CAN_MODIFY"; exit 1; }
[[ "$MODIFY_NEW_CHECKOUT" == "$CHECKOUT_EXT" ]] || { echo "ASSERT_FAIL: MODIFY_NEW_CHECKOUT"; exit 1; }
[[ "$CANCEL_STATUS" == "CANCELLED" ]] || { echo "ASSERT_FAIL: CANCEL_STATUS"; exit 1; }
[[ "$PROFILE_PHONE" == "$GUEST_PHONE" ]] || { echo "ASSERT_FAIL: PROFILE_PHONE"; exit 1; }
[[ "$PROFILE_UPDATED_NAME" == "Guest Pack7 Updated" ]] || { echo "ASSERT_FAIL: PROFILE_UPDATED_NAME"; exit 1; }

printf 'SEARCH_COUNT=%s\n' "$SEARCH_COUNT"
printf 'DETAILS_PROPERTY=%s\n' "$DETAILS_PROPERTY"
printf 'ROOM_TYPE_USED=%s\n' "$ROOM_TYPE"
printf 'CREATE_RESERVATION_ID=%s\n' "$RESERVATION_ID"
printf 'CREATE_IDEMPOTENT_MATCH=%s\n' "$CREATE_IDEMPOTENT_MATCH"
printf 'LIST_UPCOMING_COUNT=%s\n' "$LIST_UPCOMING_COUNT"
printf 'DETAIL_CAN_MODIFY=%s\n' "$DETAIL_CAN_MODIFY"
printf 'MODIFY_NEW_CHECKOUT=%s\n' "$MODIFY_NEW_CHECKOUT"
printf 'CANCEL_STATUS=%s\n' "$CANCEL_STATUS"
printf 'PROFILE_PHONE=%s\n' "$PROFILE_PHONE"
printf 'PROFILE_UPDATED_NAME=%s\n' "$PROFILE_UPDATED_NAME"
