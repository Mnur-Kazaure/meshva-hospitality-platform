-- Demo seed data for Housekeeping Pack #4

BEGIN;

INSERT INTO users (id, tenant_id, full_name, email, auth_provider, status)
VALUES (
  '70000000-0000-4000-8000-000000000004',
  '11111111-1111-1111-1111-111111111111',
  'Housekeeping Attendant',
  'housekeeping@meshva.com',
  'otp',
  'active'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO maintenance_tickets (
  id,
  tenant_id,
  property_id,
  room_id,
  title,
  description,
  severity,
  status,
  reported_by_user_id,
  created_at,
  updated_at
)
VALUES (
  '6b000000-0000-4000-8000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '50000000-0000-4000-8000-000000000001',
  'Loose shower handle',
  'Shower handle in room 101 is loose and needs tightening.',
  'MEDIUM',
  'OPEN',
  '70000000-0000-4000-8000-000000000004',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

COMMIT;
