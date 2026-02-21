-- Demo seed data for Cashier & Finance Pack #3

BEGIN;

INSERT INTO users (id, tenant_id, full_name, email, auth_provider, status)
VALUES (
  '70000000-0000-4000-8000-000000000003',
  '11111111-1111-1111-1111-111111111111',
  'Finance Cashier',
  'finance@meshva.com',
  'otp',
  'active'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO invoices (
  id,
  tenant_id,
  property_id,
  invoice_number,
  reservation_id,
  guest_id,
  issued_on,
  currency,
  status,
  created_at,
  updated_at
)
VALUES (
  '67000000-0000-4000-8000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  'INV-2222-5001',
  '63000000-0000-4000-8000-000000000002',
  '62000000-0000-4000-8000-000000000002',
  CURRENT_DATE,
  'NGN',
  'OPEN',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO folio_line_items (
  id,
  tenant_id,
  property_id,
  invoice_id,
  entity_type,
  entity_id,
  line_type,
  amount,
  currency,
  description,
  created_by_user_id,
  created_at
)
VALUES
  (
    '68000000-0000-4000-8000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '67000000-0000-4000-8000-000000000001',
    'RESERVATION',
    '63000000-0000-4000-8000-000000000002',
    'CHARGE',
    65000,
    'NGN',
    'Room charge - Deluxe Rack',
    '70000000-0000-4000-8000-000000000001',
    NOW()
  ),
  (
    '68000000-0000-4000-8000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '67000000-0000-4000-8000-000000000001',
    'RESERVATION',
    '63000000-0000-4000-8000-000000000002',
    'KITCHEN_CHARGE',
    12000,
    'NGN',
    'Kitchen charge - room service',
    '70000000-0000-4000-8000-000000000001',
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO payments (
  id,
  tenant_id,
  property_id,
  invoice_id,
  method,
  amount,
  payment_type,
  status,
  reference,
  note,
  created_by_user_id,
  created_at,
  updated_at
)
VALUES (
  '69000000-0000-4000-8000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '67000000-0000-4000-8000-000000000001',
  'CASH',
  30000,
  'PAYMENT',
  'RECORDED',
  NULL,
  'Initial deposit collected',
  '70000000-0000-4000-8000-000000000003',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO refund_requests (
  id,
  tenant_id,
  property_id,
  invoice_id,
  amount,
  reason,
  status,
  requested_by_user_id,
  approved_by_user_id,
  note,
  created_at,
  updated_at
)
VALUES (
  '66000000-0000-4000-8000-000000000002',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '67000000-0000-4000-8000-000000000001',
  5000,
  'Guest overcharged on transfer posting',
  'APPROVED',
  '70000000-0000-4000-8000-000000000003',
  '70000000-0000-4000-8000-000000000002',
  'Approved for cashier execution',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE refund_requests
  VALIDATE CONSTRAINT fk_refund_requests_invoice;

COMMIT;
