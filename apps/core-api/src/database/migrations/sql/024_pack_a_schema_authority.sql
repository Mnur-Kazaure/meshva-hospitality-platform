-- Pack A: Database Schema Authority (production-grade, backward-compatible)
-- Scope: tenancy/core hardening + rooms/inventory + reservations/stays + billing integrity

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) ENUM / SHARED DOMAIN ENRICHMENTS
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  ALTER TYPE room_status ADD VALUE IF NOT EXISTS 'OUT_OF_ORDER';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- 2) ROOM TYPES / ROOMS ENRICHMENT
-- ---------------------------------------------------------------------------
ALTER TABLE room_types
  ADD COLUMN IF NOT EXISTS capacity int,
  ADD COLUMN IF NOT EXISTS base_rate numeric(12,2);

UPDATE room_types
SET capacity = COALESCE(capacity, 1),
    base_rate = COALESCE(base_rate, 0)
WHERE capacity IS NULL OR base_rate IS NULL;

ALTER TABLE room_types
  ALTER COLUMN capacity SET DEFAULT 1,
  ALTER COLUMN base_rate SET DEFAULT 0,
  ALTER COLUMN capacity SET NOT NULL,
  ALTER COLUMN base_rate SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'room_types_capacity_nonzero'
  ) THEN
    ALTER TABLE room_types
      ADD CONSTRAINT room_types_capacity_nonzero CHECK (capacity >= 1);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'room_types_base_rate_nonnegative'
  ) THEN
    ALTER TABLE room_types
      ADD CONSTRAINT room_types_base_rate_nonnegative CHECK (base_rate >= 0);
  END IF;
END $$;

ALTER TABLE rooms
  ADD COLUMN IF NOT EXISTS floor text;

-- ---------------------------------------------------------------------------
-- 3) RESERVATION / STAY ENRICHMENT
-- ---------------------------------------------------------------------------
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS confirmation_code text,
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid REFERENCES users(id);

UPDATE reservations
SET confirmation_code = code
WHERE confirmation_code IS NULL;

CREATE OR REPLACE FUNCTION set_reservation_confirmation_code_default()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.confirmation_code IS NULL OR btrim(NEW.confirmation_code) = '' THEN
    NEW.confirmation_code := NEW.code;
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_set_reservation_confirmation_code_default'
      AND tgrelid = 'reservations'::regclass
  ) THEN
    CREATE TRIGGER trg_set_reservation_confirmation_code_default
    BEFORE INSERT OR UPDATE OF code, confirmation_code ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION set_reservation_confirmation_code_default();
  END IF;
END $$;

ALTER TABLE reservations
  ALTER COLUMN confirmation_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_reservations_confirmation_code
  ON reservations(tenant_id, property_id, confirmation_code);

ALTER TABLE stays
  ADD COLUMN IF NOT EXISTS expected_check_out_at timestamptz;

UPDATE stays
SET expected_check_out_at = (planned_check_out::text || 'T12:00:00+00')::timestamptz
WHERE expected_check_out_at IS NULL;

CREATE OR REPLACE FUNCTION set_stay_expected_checkout_default()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.expected_check_out_at IS NULL THEN
    NEW.expected_check_out_at := (NEW.planned_check_out::text || 'T12:00:00+00')::timestamptz;
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_set_stay_expected_checkout_default'
      AND tgrelid = 'stays'::regclass
  ) THEN
    CREATE TRIGGER trg_set_stay_expected_checkout_default
    BEFORE INSERT OR UPDATE OF planned_check_out, expected_check_out_at ON stays
    FOR EACH ROW
    EXECUTE FUNCTION set_stay_expected_checkout_default();
  END IF;
END $$;

ALTER TABLE stays
  ALTER COLUMN expected_check_out_at SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'stays_expected_checkout_after_checkin'
  ) THEN
    ALTER TABLE stays
      ADD CONSTRAINT stays_expected_checkout_after_checkin
      CHECK (expected_check_out_at >= check_in_at);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS ix_stays_property_status
  ON stays(property_id, status);

-- ---------------------------------------------------------------------------
-- 4) BILLING ENRICHMENT + DERIVED TOTALS
-- ---------------------------------------------------------------------------
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS total_amount numeric(12,2);

UPDATE invoices i
SET total_amount = COALESCE(items.total, 0)
FROM (
  SELECT invoice_id, SUM(amount)::numeric(12,2) AS total
  FROM folio_line_items
  WHERE invoice_id IS NOT NULL
  GROUP BY invoice_id
) AS items
WHERE i.id = items.invoice_id;

UPDATE invoices
SET total_amount = COALESCE(total_amount, 0)
WHERE total_amount IS NULL;

ALTER TABLE invoices
  ALTER COLUMN total_amount SET DEFAULT 0,
  ALTER COLUMN total_amount SET NOT NULL;

CREATE INDEX IF NOT EXISTS ix_invoices_property_stay
  ON invoices(property_id, stay_id)
  WHERE stay_id IS NOT NULL;

ALTER TABLE daily_close_reports
  ADD COLUMN IF NOT EXISTS variance numeric(12,2);

UPDATE daily_close_reports
SET variance = COALESCE(variance_cash, 0) + COALESCE(variance_transfer, 0) + COALESCE(variance_pos, 0)
WHERE variance IS NULL;

ALTER TABLE daily_close_reports
  ALTER COLUMN variance SET DEFAULT 0,
  ALTER COLUMN variance SET NOT NULL;

CREATE OR REPLACE FUNCTION sync_invoice_total_amount_from_folio()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  target_invoice_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_invoice_id := OLD.invoice_id;
  ELSE
    target_invoice_id := NEW.invoice_id;
  END IF;

  IF target_invoice_id IS NOT NULL THEN
    UPDATE invoices i
    SET total_amount = COALESCE(items.total, 0),
        updated_at = NOW()
    FROM (
      SELECT invoice_id, SUM(amount)::numeric(12,2) AS total
      FROM folio_line_items
      WHERE invoice_id = target_invoice_id
      GROUP BY invoice_id
    ) items
    WHERE i.id = target_invoice_id
      AND i.id = items.invoice_id;

    UPDATE invoices
    SET total_amount = 0,
        updated_at = NOW()
    WHERE id = target_invoice_id
      AND NOT EXISTS (
        SELECT 1 FROM folio_line_items
        WHERE invoice_id = target_invoice_id
      );
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.invoice_id IS DISTINCT FROM NEW.invoice_id AND OLD.invoice_id IS NOT NULL THEN
    UPDATE invoices i
    SET total_amount = COALESCE(items.total, 0),
        updated_at = NOW()
    FROM (
      SELECT invoice_id, SUM(amount)::numeric(12,2) AS total
      FROM folio_line_items
      WHERE invoice_id = OLD.invoice_id
      GROUP BY invoice_id
    ) items
    WHERE i.id = OLD.invoice_id
      AND i.id = items.invoice_id;

    UPDATE invoices
    SET total_amount = 0,
        updated_at = NOW()
    WHERE id = OLD.invoice_id
      AND NOT EXISTS (
        SELECT 1 FROM folio_line_items
        WHERE invoice_id = OLD.invoice_id
      );
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_sync_invoice_total_amount_from_folio'
      AND tgrelid = 'folio_line_items'::regclass
  ) THEN
    CREATE TRIGGER trg_sync_invoice_total_amount_from_folio
    AFTER INSERT OR UPDATE OR DELETE ON folio_line_items
    FOR EACH ROW
    EXECUTE FUNCTION sync_invoice_total_amount_from_folio();
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 5) INVENTORY CALENDAR (AUTHORITATIVE DAILY STOCK VIEW)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_calendar (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  room_type_id uuid NOT NULL REFERENCES room_types(id),
  date date NOT NULL,
  available_units int NOT NULL CHECK (available_units >= 0),
  blocked_units int NOT NULL DEFAULT 0 CHECK (blocked_units >= 0),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, property_id, room_type_id, date)
);

CREATE INDEX IF NOT EXISTS ix_inventory_calendar_lookup
  ON inventory_calendar(tenant_id, property_id, room_type_id, date);

-- ---------------------------------------------------------------------------
-- 6) TENANCY-SCOPED RELATIONAL GUARDS (NOT VALID => safe rollout)
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS ux_room_types_scope_key ON room_types(tenant_id, property_id, id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_guests_scope_key ON guests(tenant_id, property_id, id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_rooms_scope_key ON rooms(tenant_id, property_id, id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_reservations_scope_key ON reservations(tenant_id, property_id, id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_stays_scope_key ON stays(tenant_id, property_id, id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_invoices_scope_key ON invoices(tenant_id, property_id, id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_refund_requests_scope_key ON refund_requests(tenant_id, property_id, id);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_rooms_room_types_scope') THEN
    ALTER TABLE rooms
      ADD CONSTRAINT fk_rooms_room_types_scope
      FOREIGN KEY (tenant_id, property_id, room_type_id)
      REFERENCES room_types(tenant_id, property_id, id)
      NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_reservations_guests_scope') THEN
    ALTER TABLE reservations
      ADD CONSTRAINT fk_reservations_guests_scope
      FOREIGN KEY (tenant_id, property_id, guest_id)
      REFERENCES guests(tenant_id, property_id, id)
      NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_reservations_room_types_scope') THEN
    ALTER TABLE reservations
      ADD CONSTRAINT fk_reservations_room_types_scope
      FOREIGN KEY (tenant_id, property_id, room_type_id)
      REFERENCES room_types(tenant_id, property_id, id)
      NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_stays_reservations_scope') THEN
    ALTER TABLE stays
      ADD CONSTRAINT fk_stays_reservations_scope
      FOREIGN KEY (tenant_id, property_id, reservation_id)
      REFERENCES reservations(tenant_id, property_id, id)
      NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_stays_guests_scope') THEN
    ALTER TABLE stays
      ADD CONSTRAINT fk_stays_guests_scope
      FOREIGN KEY (tenant_id, property_id, guest_id)
      REFERENCES guests(tenant_id, property_id, id)
      NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_stays_rooms_scope') THEN
    ALTER TABLE stays
      ADD CONSTRAINT fk_stays_rooms_scope
      FOREIGN KEY (tenant_id, property_id, room_id)
      REFERENCES rooms(tenant_id, property_id, id)
      NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_invoices_stays_scope') THEN
    ALTER TABLE invoices
      ADD CONSTRAINT fk_invoices_stays_scope
      FOREIGN KEY (tenant_id, property_id, stay_id)
      REFERENCES stays(tenant_id, property_id, id)
      NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_invoices_reservations_scope') THEN
    ALTER TABLE invoices
      ADD CONSTRAINT fk_invoices_reservations_scope
      FOREIGN KEY (tenant_id, property_id, reservation_id)
      REFERENCES reservations(tenant_id, property_id, id)
      NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_invoices_guests_scope') THEN
    ALTER TABLE invoices
      ADD CONSTRAINT fk_invoices_guests_scope
      FOREIGN KEY (tenant_id, property_id, guest_id)
      REFERENCES guests(tenant_id, property_id, id)
      NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_payments_invoices_scope') THEN
    ALTER TABLE payments
      ADD CONSTRAINT fk_payments_invoices_scope
      FOREIGN KEY (tenant_id, property_id, invoice_id)
      REFERENCES invoices(tenant_id, property_id, id)
      NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_folio_items_invoices_scope') THEN
    ALTER TABLE folio_line_items
      ADD CONSTRAINT fk_folio_items_invoices_scope
      FOREIGN KEY (tenant_id, property_id, invoice_id)
      REFERENCES invoices(tenant_id, property_id, id)
      NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_refund_requests_invoices_scope') THEN
    ALTER TABLE refund_requests
      ADD CONSTRAINT fk_refund_requests_invoices_scope
      FOREIGN KEY (tenant_id, property_id, invoice_id)
      REFERENCES invoices(tenant_id, property_id, id)
      NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_refund_executions_requests_scope') THEN
    ALTER TABLE refund_executions
      ADD CONSTRAINT fk_refund_executions_requests_scope
      FOREIGN KEY (tenant_id, property_id, refund_request_id)
      REFERENCES refund_requests(tenant_id, property_id, id)
      NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_housekeeping_tasks_rooms_scope') THEN
    ALTER TABLE housekeeping_tasks
      ADD CONSTRAINT fk_housekeeping_tasks_rooms_scope
      FOREIGN KEY (tenant_id, property_id, room_id)
      REFERENCES rooms(tenant_id, property_id, id)
      NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_housekeeping_tasks_stays_scope') THEN
    ALTER TABLE housekeeping_tasks
      ADD CONSTRAINT fk_housekeeping_tasks_stays_scope
      FOREIGN KEY (tenant_id, property_id, stay_id)
      REFERENCES stays(tenant_id, property_id, id)
      NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_maintenance_tickets_rooms_scope') THEN
    ALTER TABLE maintenance_tickets
      ADD CONSTRAINT fk_maintenance_tickets_rooms_scope
      FOREIGN KEY (tenant_id, property_id, room_id)
      REFERENCES rooms(tenant_id, property_id, id)
      NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_rate_plans_room_types_scope') THEN
    ALTER TABLE rate_plans
      ADD CONSTRAINT fk_rate_plans_room_types_scope
      FOREIGN KEY (tenant_id, property_id, room_type_id)
      REFERENCES room_types(tenant_id, property_id, id)
      NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_inventory_blocks_room_types_scope') THEN
    ALTER TABLE inventory_blocks
      ADD CONSTRAINT fk_inventory_blocks_room_types_scope
      FOREIGN KEY (tenant_id, property_id, room_type_id)
      REFERENCES room_types(tenant_id, property_id, id)
      NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_inventory_overrides_room_types_scope') THEN
    ALTER TABLE inventory_overrides
      ADD CONSTRAINT fk_inventory_overrides_room_types_scope
      FOREIGN KEY (tenant_id, property_id, room_type_id)
      REFERENCES room_types(tenant_id, property_id, id)
      NOT VALID;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 7) IMMUTABLE LEDGER / INVENTORY DELETE GUARDS
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION prevent_immutable_delete()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Delete is prohibited for immutable table %', TG_TABLE_NAME;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_no_delete_invoices'
      AND tgrelid = 'invoices'::regclass
  ) THEN
    CREATE TRIGGER trg_no_delete_invoices
    BEFORE DELETE ON invoices
    FOR EACH ROW EXECUTE FUNCTION prevent_immutable_delete();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_no_delete_payments'
      AND tgrelid = 'payments'::regclass
  ) THEN
    CREATE TRIGGER trg_no_delete_payments
    BEFORE DELETE ON payments
    FOR EACH ROW EXECUTE FUNCTION prevent_immutable_delete();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_no_delete_folio_line_items'
      AND tgrelid = 'folio_line_items'::regclass
  ) THEN
    CREATE TRIGGER trg_no_delete_folio_line_items
    BEFORE DELETE ON folio_line_items
    FOR EACH ROW EXECUTE FUNCTION prevent_immutable_delete();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_no_delete_inventory_blocks'
      AND tgrelid = 'inventory_blocks'::regclass
  ) THEN
    CREATE TRIGGER trg_no_delete_inventory_blocks
    BEFORE DELETE ON inventory_blocks
    FOR EACH ROW EXECUTE FUNCTION prevent_immutable_delete();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_no_delete_inventory_overrides'
      AND tgrelid = 'inventory_overrides'::regclass
  ) THEN
    CREATE TRIGGER trg_no_delete_inventory_overrides
    BEFORE DELETE ON inventory_overrides
    FOR EACH ROW EXECUTE FUNCTION prevent_immutable_delete();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_no_delete_refund_executions'
      AND tgrelid = 'refund_executions'::regclass
  ) THEN
    CREATE TRIGGER trg_no_delete_refund_executions
    BEFORE DELETE ON refund_executions
    FOR EACH ROW EXECUTE FUNCTION prevent_immutable_delete();
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 8) PERFORMANCE INDEXES ALIGNED TO SEALED DASHBOARD QUERIES
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS ix_properties_tenant_lookup ON properties(tenant_id, status);
CREATE INDEX IF NOT EXISTS ix_users_tenant_lookup ON users(tenant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_rooms_property_status ON rooms(tenant_id, property_id, status, room_number);
CREATE INDEX IF NOT EXISTS ix_guests_tenant_phone ON guests(tenant_id, phone);
CREATE INDEX IF NOT EXISTS ix_reservations_property_checkin ON reservations(property_id, check_in);
CREATE INDEX IF NOT EXISTS ix_reservations_property_status ON reservations(property_id, status);
CREATE INDEX IF NOT EXISTS ix_payments_property_created ON payments(property_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_audit_logs_entity_lookup ON audit_logs(tenant_id, entity_type, entity_id, created_at DESC);

COMMIT;
