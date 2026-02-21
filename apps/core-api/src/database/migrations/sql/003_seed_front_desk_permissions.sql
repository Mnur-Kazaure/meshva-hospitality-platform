-- Seed permission codes for Front Desk pack

BEGIN;

INSERT INTO permissions (id, code, description)
VALUES
  (gen_random_uuid(), 'FRONT_DESK.RESERVATION_VIEW', 'View reservations and room board'),
  (gen_random_uuid(), 'FRONT_DESK.RESERVATION_CREATE', 'Create reservations'),
  (gen_random_uuid(), 'FRONT_DESK.RESERVATION_EDIT', 'Edit reservations and extend stays'),
  (gen_random_uuid(), 'FRONT_DESK.RESERVATION_CANCEL', 'Cancel reservations'),
  (gen_random_uuid(), 'FRONT_DESK.STAY_CHECKIN', 'Perform check-in'),
  (gen_random_uuid(), 'FRONT_DESK.STAY_CHECKOUT', 'Perform check-out'),
  (gen_random_uuid(), 'FRONT_DESK.ROOM_ASSIGN', 'Assign and change rooms'),
  (gen_random_uuid(), 'FRONT_DESK.GUEST_VIEW', 'View guests'),
  (gen_random_uuid(), 'FRONT_DESK.GUEST_CREATE', 'Create guests'),
  (gen_random_uuid(), 'FRONT_DESK.GUEST_EDIT', 'Edit guests'),
  (gen_random_uuid(), 'FRONT_DESK.SHIFT_HANDOVER_CREATE', 'Create shift handover notes'),
  (gen_random_uuid(), 'FRONT_DESK.CONFIRMATION_SEND', 'Queue WhatsApp/SMS/print confirmations'),
  (gen_random_uuid(), 'FRONT_DESK.PAYMENT_VIEW_SUMMARY', 'View payment summary read-only')
ON CONFLICT (code) DO NOTHING;

COMMIT;
