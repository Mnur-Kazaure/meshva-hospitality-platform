#!/usr/bin/env bash
set -euo pipefail

DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-meshva_hospitality}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"

PSQL=(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -q)

assert_equals() {
  local label="$1"
  local actual="$2"
  local expected="$3"
  if [[ "$actual" != "$expected" ]]; then
    echo "ASSERT_FAIL: ${label} (expected=${expected}, actual=${actual})"
    exit 1
  fi
}

echo "[pack-a] validating authoritative schema objects"

inventory_calendar_exists=$(
  PGPASSWORD="$DB_PASSWORD" "${PSQL[@]}" -At -c "SELECT CASE WHEN to_regclass('public.inventory_calendar') IS NULL THEN '0' ELSE '1' END;"
)
assert_equals "inventory_calendar_exists" "$inventory_calendar_exists" "1"

confirmation_code_nullable=$(
  PGPASSWORD="$DB_PASSWORD" "${PSQL[@]}" -At -c "SELECT is_nullable FROM information_schema.columns WHERE table_name='reservations' AND column_name='confirmation_code';"
)
assert_equals "reservations.confirmation_code_not_null" "$confirmation_code_nullable" "NO"

expected_checkout_nullable=$(
  PGPASSWORD="$DB_PASSWORD" "${PSQL[@]}" -At -c "SELECT is_nullable FROM information_schema.columns WHERE table_name='stays' AND column_name='expected_check_out_at';"
)
assert_equals "stays.expected_check_out_at_not_null" "$expected_checkout_nullable" "NO"

invoice_total_nullable=$(
  PGPASSWORD="$DB_PASSWORD" "${PSQL[@]}" -At -c "SELECT is_nullable FROM information_schema.columns WHERE table_name='invoices' AND column_name='total_amount';"
)
assert_equals "invoices.total_amount_not_null" "$invoice_total_nullable" "NO"

sync_trigger_exists=$(
  PGPASSWORD="$DB_PASSWORD" "${PSQL[@]}" -At -c "SELECT COUNT(*)::text FROM pg_trigger WHERE tgname='trg_sync_invoice_total_amount_from_folio';"
)
assert_equals "trigger_sync_invoice_total_amount_from_folio" "$sync_trigger_exists" "1"

delete_guard_exists=$(
  PGPASSWORD="$DB_PASSWORD" "${PSQL[@]}" -At -c "SELECT COUNT(*)::text FROM pg_trigger WHERE tgname='trg_no_delete_payments';"
)
assert_equals "trigger_no_delete_payments" "$delete_guard_exists" "1"

echo "[pack-a] validating runtime integrity (invoice sync + immutable delete guard)"

PGPASSWORD="$DB_PASSWORD" "${PSQL[@]}" <<'SQL'
BEGIN;
DO $$
DECLARE
  v_invoice_id uuid;
  v_tenant_id uuid;
  v_property_id uuid;
  v_actor_user_id uuid;
  v_entity_id uuid;
  v_entity_type text;
  v_before numeric(12,2);
  v_after_insert numeric(12,2);
  v_after_update numeric(12,2);
  v_description text;
  v_payment_id uuid;
BEGIN
  SELECT
    i.id,
    i.tenant_id,
    i.property_id,
    COALESCE(i.stay_id, i.reservation_id),
    CASE WHEN i.stay_id IS NOT NULL THEN 'STAY' ELSE 'RESERVATION' END,
    i.total_amount,
    (SELECT u.id FROM users u WHERE u.tenant_id = i.tenant_id ORDER BY u.created_at ASC LIMIT 1)
  INTO
    v_invoice_id,
    v_tenant_id,
    v_property_id,
    v_entity_id,
    v_entity_type,
    v_before,
    v_actor_user_id
  FROM invoices i
  WHERE COALESCE(i.stay_id, i.reservation_id) IS NOT NULL
  ORDER BY i.created_at DESC
  LIMIT 1;

  IF v_invoice_id IS NULL THEN
    RAISE EXCEPTION 'Pack A smoke failed: no invoice with stay/reservation link found.';
  END IF;

  IF v_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'Pack A smoke failed: no actor user found for invoice tenant.';
  END IF;

  v_description := 'Pack A sync smoke ' || gen_random_uuid()::text;

  INSERT INTO folio_line_items (
    id,
    tenant_id,
    property_id,
    entity_type,
    entity_id,
    line_type,
    amount,
    currency,
    description,
    created_by_user_id,
    created_at,
    invoice_id
  )
  VALUES (
    gen_random_uuid(),
    v_tenant_id,
    v_property_id,
    v_entity_type,
    v_entity_id,
    'ADJUSTMENT',
    123.45,
    'NGN',
    v_description,
    v_actor_user_id,
    NOW(),
    v_invoice_id
  );

  SELECT total_amount
  INTO v_after_insert
  FROM invoices
  WHERE id = v_invoice_id;

  IF v_after_insert < (v_before + 123.45 - 0.01) THEN
    RAISE EXCEPTION
      'Pack A smoke failed: invoice total did not sync after insert (before %, after %).',
      v_before, v_after_insert;
  END IF;

  UPDATE folio_line_items
  SET amount = 200.00
  WHERE invoice_id = v_invoice_id
    AND description = v_description;

  SELECT total_amount
  INTO v_after_update
  FROM invoices
  WHERE id = v_invoice_id;

  IF v_after_update < (v_before + 200.00 - 0.01) THEN
    RAISE EXCEPTION
      'Pack A smoke failed: invoice total did not sync after update (before %, after %).',
      v_before, v_after_update;
  END IF;

  SELECT id
  INTO v_payment_id
  FROM payments
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_payment_id IS NOT NULL THEN
    BEGIN
      DELETE FROM payments WHERE id = v_payment_id;
      RAISE EXCEPTION 'Pack A smoke failed: immutable delete guard did not block payment delete.';
    EXCEPTION
      WHEN OTHERS THEN
        IF POSITION('Delete is prohibited for immutable table payments' IN SQLERRM) = 0 THEN
          RAISE;
        END IF;
    END;
  END IF;
END
$$;
ROLLBACK;
SQL

echo "[pack-a] smoke checks passed"
