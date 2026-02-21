-- Guest Portal Pack #7 schema additions

BEGIN;

DO $$
BEGIN
  ALTER TYPE booking_source ADD VALUE IF NOT EXISTS 'ONLINE';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS ix_reservations_guest_lookup
  ON reservations(tenant_id, property_id, guest_phone, check_in DESC);

CREATE INDEX IF NOT EXISTS ix_guests_contact_lookup
  ON guests(tenant_id, property_id, phone, email);

COMMIT;
