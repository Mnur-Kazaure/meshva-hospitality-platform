-- Demo seed data for Manager Pack #2

BEGIN;

INSERT INTO users (id, tenant_id, full_name, email, auth_provider, status)
VALUES (
  '70000000-0000-4000-8000-000000000002',
  '11111111-1111-1111-1111-111111111111',
  'Hotel Manager',
  'manager@meshva.com',
  'otp',
  'active'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO rate_plans (
  id, tenant_id, property_id, room_type_id, name, base_rate, currency,
  effective_from, effective_to, created_at, updated_at
)
VALUES
  (
    '61000000-0000-4000-8000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-4333-8333-333333333333',
    'Standard Rack',
    42000,
    'NGN',
    CURRENT_DATE,
    NULL,
    NOW(),
    NOW()
  ),
  (
    '61000000-0000-4000-8000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '44444444-4444-4444-8444-444444444444',
    'Deluxe Rack',
    65000,
    'NGN',
    CURRENT_DATE,
    NULL,
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO guests (
  id, tenant_id, property_id, full_name, phone, email, created_at, updated_at
)
VALUES
  (
    '62000000-0000-4000-8000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'Amina Yusuf',
    '+2348011111111',
    'amina@example.com',
    NOW(),
    NOW()
  ),
  (
    '62000000-0000-4000-8000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'Khalid Musa',
    '+2348022222222',
    NULL,
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO reservations (
  id, tenant_id, property_id, code, guest_id, guest_full_name, guest_phone,
  room_type_id, check_in, check_out, adults, children, source, notes, no_phone,
  deposit_status, status, created_at, updated_at
)
VALUES
  (
    '63000000-0000-4000-8000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'RSV-2222-2001',
    '62000000-0000-4000-8000-000000000001',
    'Amina Yusuf',
    '+2348011111111',
    '33333333-3333-4333-8333-333333333333',
    CURRENT_DATE + 1,
    CURRENT_DATE + 7,
    1,
    0,
    'CALL',
    'Pending manager confirmation',
    false,
    'PROMISED',
    'PENDING_CONFIRM',
    NOW(),
    NOW()
  ),
  (
    '63000000-0000-4000-8000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'RSV-2222-2002',
    '62000000-0000-4000-8000-000000000002',
    'Khalid Musa',
    '+2348022222222',
    '44444444-4444-4444-8444-444444444444',
    CURRENT_DATE + 7,
    CURRENT_DATE + 14,
    2,
    1,
    'WHATSAPP',
    NULL,
    false,
    'NONE',
    'CONFIRMED',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO discount_requests (
  id, tenant_id, property_id, entity_type, entity_id, discount_type, value, reason,
  status, requested_by_user_id, created_at, updated_at
)
VALUES
  (
    '64000000-0000-4000-8000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'RESERVATION',
    '63000000-0000-4000-8000-000000000002',
    'AMOUNT',
    5000,
    'Loyal guest discount',
    'REQUESTED',
    '70000000-0000-4000-8000-000000000001',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO override_requests (
  id, tenant_id, property_id, override_type, entity_type, entity_id, reason,
  requested_value, status, requested_by_user_id, created_at, updated_at
)
VALUES
  (
    '65000000-0000-4000-8000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'EXTEND_CONFLICT',
    'RESERVATION',
    '63000000-0000-4000-8000-000000000002',
    'VIP extension request despite limited inventory',
    '{"requestedNights": 2}'::jsonb,
    'REQUESTED',
    '70000000-0000-4000-8000-000000000001',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO refund_requests (
  id, tenant_id, property_id, invoice_id, amount, reason, status, requested_by_user_id,
  created_at, updated_at
)
VALUES
  (
    '66000000-0000-4000-8000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '67000000-0000-4000-8000-000000000001',
    10000,
    'Duplicate transfer reversal request',
    'REQUESTED',
    '70000000-0000-4000-8000-000000000002',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

COMMIT;
