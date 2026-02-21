-- Demo seed data for Guest Portal Pack #7

BEGIN;

INSERT INTO guests (
  id,
  tenant_id,
  property_id,
  full_name,
  phone,
  email,
  notes,
  created_at,
  updated_at
)
VALUES (
  '62000000-0000-4000-8000-000000000003',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  'Maryam Bello',
  '+2348033333333',
  'maryam.bello@example.com',
  'Guest portal demo user',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO reservations (
  id,
  tenant_id,
  property_id,
  code,
  guest_id,
  guest_full_name,
  guest_phone,
  room_type_id,
  check_in,
  check_out,
  adults,
  children,
  source,
  notes,
  no_phone,
  deposit_status,
  status,
  created_at,
  updated_at
)
VALUES (
  '63000000-0000-4000-8000-000000000003',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  'RSV-2222-3001',
  '62000000-0000-4000-8000-000000000003',
  'Maryam Bello',
  '+2348033333333',
  '33333333-3333-4333-8333-333333333333',
  CURRENT_DATE + 3,
  CURRENT_DATE + 6,
  2,
  0,
  'ONLINE',
  'Created from guest portal demo seed',
  false,
  'NONE',
  'CONFIRMED',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

COMMIT;
