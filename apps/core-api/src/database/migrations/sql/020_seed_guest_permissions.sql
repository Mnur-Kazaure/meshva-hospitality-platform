-- Seed permission codes for Guest Portal Pack #7

BEGIN;

INSERT INTO permissions (id, code, description)
VALUES
  (gen_random_uuid(), 'GUEST.BOOKING_VIEW', 'View own bookings and booking details'),
  (gen_random_uuid(), 'GUEST.BOOKING_CREATE', 'Create self-service guest bookings'),
  (gen_random_uuid(), 'GUEST.BOOKING_MODIFY', 'Modify own bookings within policy windows'),
  (gen_random_uuid(), 'GUEST.BOOKING_CANCEL', 'Cancel own bookings within policy windows'),
  (gen_random_uuid(), 'GUEST.PROFILE_EDIT', 'Edit own guest profile details')
ON CONFLICT (code) DO NOTHING;

COMMIT;
