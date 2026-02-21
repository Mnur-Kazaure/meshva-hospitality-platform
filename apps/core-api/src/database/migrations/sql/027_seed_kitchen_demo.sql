-- Demo seed data for Kitchen Pack #8

BEGIN;

INSERT INTO users (id, tenant_id, full_name, email, phone, auth_provider, status)
VALUES (
  '70000000-0000-4000-8000-000000000007',
  '11111111-1111-1111-1111-111111111111',
  'Kitchen Staff',
  'kitchen@meshva.com',
  '+2348033333333',
  'otp',
  'active'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO stays (
  id,
  tenant_id,
  property_id,
  reservation_id,
  guest_id,
  room_id,
  id_number,
  status,
  check_in_at,
  planned_check_out,
  notes,
  created_at,
  updated_at
)
VALUES (
  '6d000000-0000-4000-8000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '63000000-0000-4000-8000-000000000002',
  '62000000-0000-4000-8000-000000000002',
  '50000000-0000-4000-8000-000000000006',
  NULL,
  'OPEN',
  NOW() - INTERVAL '2 hours',
  CURRENT_DATE + 3,
  'Demo open stay for kitchen workflow',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

UPDATE rooms
SET status = 'OCCUPIED', updated_at = NOW()
WHERE id = '50000000-0000-4000-8000-000000000006'
  AND tenant_id = '11111111-1111-1111-1111-111111111111'
  AND property_id = '22222222-2222-2222-2222-222222222222';

INSERT INTO invoices (
  id,
  tenant_id,
  property_id,
  invoice_number,
  reservation_id,
  stay_id,
  guest_id,
  issued_on,
  currency,
  status,
  created_at,
  updated_at
)
VALUES (
  '67000000-0000-4000-8000-000000000003',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  'INV-2222-5003',
  '63000000-0000-4000-8000-000000000002',
  '6d000000-0000-4000-8000-000000000001',
  '62000000-0000-4000-8000-000000000002',
  CURRENT_DATE,
  'NGN',
  'OPEN',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO menu_categories (
  id,
  tenant_id,
  property_id,
  name,
  created_by_user_id,
  updated_by_user_id,
  created_at,
  updated_at
)
VALUES
  (
    '6e000000-0000-4000-8000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'Main Meals',
    '70000000-0000-4000-8000-000000000007',
    '70000000-0000-4000-8000-000000000007',
    NOW(),
    NOW()
  ),
  (
    '6e000000-0000-4000-8000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'Drinks',
    '70000000-0000-4000-8000-000000000007',
    '70000000-0000-4000-8000-000000000007',
    NOW(),
    NOW()
  ),
  (
    '6e000000-0000-4000-8000-000000000003',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'Desserts',
    '70000000-0000-4000-8000-000000000007',
    '70000000-0000-4000-8000-000000000007',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO menu_items (
  id,
  tenant_id,
  property_id,
  category_id,
  name,
  price,
  active,
  description,
  created_by_user_id,
  updated_by_user_id,
  created_at,
  updated_at
)
VALUES
  (
    '6f000000-0000-4000-8000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '6e000000-0000-4000-8000-000000000001',
    'Jollof Rice + Chicken',
    8500,
    true,
    'Kitchen signature jollof with grilled chicken.',
    '70000000-0000-4000-8000-000000000007',
    '70000000-0000-4000-8000-000000000007',
    NOW(),
    NOW()
  ),
  (
    '6f000000-0000-4000-8000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '6e000000-0000-4000-8000-000000000001',
    'Beef Suya Plate',
    7200,
    true,
    'Northern style beef suya with onions.',
    '70000000-0000-4000-8000-000000000007',
    '70000000-0000-4000-8000-000000000007',
    NOW(),
    NOW()
  ),
  (
    '6f000000-0000-4000-8000-000000000003',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '6e000000-0000-4000-8000-000000000002',
    'Bottled Water',
    800,
    true,
    '50cl table water',
    '70000000-0000-4000-8000-000000000007',
    '70000000-0000-4000-8000-000000000007',
    NOW(),
    NOW()
  ),
  (
    '6f000000-0000-4000-8000-000000000004',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '6e000000-0000-4000-8000-000000000003',
    'Chocolate Cake Slice',
    2200,
    true,
    'Freshly baked cake slice.',
    '70000000-0000-4000-8000-000000000007',
    '70000000-0000-4000-8000-000000000007',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO kitchen_orders (
  id,
  tenant_id,
  property_id,
  code,
  stay_id,
  room_id,
  status,
  notes,
  total_amount,
  charge_posted_at,
  charge_folio_line_item_id,
  cancelled_reason,
  created_by_user_id,
  updated_by_user_id,
  created_at,
  updated_at
)
VALUES
  (
    '70010000-0000-4000-8000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'K-1001',
    '6d000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000006',
    'NEW',
    'No pepper',
    10100,
    NULL,
    NULL,
    NULL,
    '70000000-0000-4000-8000-000000000007',
    '70000000-0000-4000-8000-000000000007',
    NOW() - INTERVAL '30 minutes',
    NOW() - INTERVAL '30 minutes'
  ),
  (
    '70010000-0000-4000-8000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'K-1002',
    '6d000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000006',
    'IN_PREP',
    'Extra spice',
    7200,
    NULL,
    NULL,
    NULL,
    '70000000-0000-4000-8000-000000000007',
    '70000000-0000-4000-8000-000000000007',
    NOW() - INTERVAL '15 minutes',
    NOW() - INTERVAL '10 minutes'
  ),
  (
    '70010000-0000-4000-8000-000000000003',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'K-1003',
    '6d000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000006',
    'DELIVERED',
    NULL,
    5000,
    NOW() - INTERVAL '5 minutes',
    NULL,
    NULL,
    '70000000-0000-4000-8000-000000000007',
    '70000000-0000-4000-8000-000000000007',
    NOW() - INTERVAL '45 minutes',
    NOW() - INTERVAL '5 minutes'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO kitchen_order_items (
  id,
  tenant_id,
  property_id,
  order_id,
  menu_item_id,
  menu_item_name,
  quantity,
  unit_price,
  line_total,
  item_note,
  created_at,
  updated_at
)
VALUES
  (
    '70020000-0000-4000-8000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '70010000-0000-4000-8000-000000000001',
    '6f000000-0000-4000-8000-000000000001',
    'Jollof Rice + Chicken',
    1,
    8500,
    8500,
    NULL,
    NOW() - INTERVAL '30 minutes',
    NOW() - INTERVAL '30 minutes'
  ),
  (
    '70020000-0000-4000-8000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '70010000-0000-4000-8000-000000000001',
    '6f000000-0000-4000-8000-000000000003',
    'Bottled Water',
    2,
    800,
    1600,
    NULL,
    NOW() - INTERVAL '30 minutes',
    NOW() - INTERVAL '30 minutes'
  ),
  (
    '70020000-0000-4000-8000-000000000003',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '70010000-0000-4000-8000-000000000002',
    '6f000000-0000-4000-8000-000000000002',
    'Beef Suya Plate',
    1,
    7200,
    7200,
    'Extra spice',
    NOW() - INTERVAL '15 minutes',
    NOW() - INTERVAL '15 minutes'
  ),
  (
    '70020000-0000-4000-8000-000000000004',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '70010000-0000-4000-8000-000000000003',
    '6f000000-0000-4000-8000-000000000003',
    'Bottled Water',
    1,
    800,
    800,
    NULL,
    NOW() - INTERVAL '45 minutes',
    NOW() - INTERVAL '45 minutes'
  ),
  (
    '70020000-0000-4000-8000-000000000005',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '70010000-0000-4000-8000-000000000003',
    '6f000000-0000-4000-8000-000000000002',
    'Beef Suya Plate',
    1,
    4200,
    4200,
    NULL,
    NOW() - INTERVAL '45 minutes',
    NOW() - INTERVAL '45 minutes'
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
  created_at,
  reference_order_id
)
VALUES (
  '70030000-0000-4000-8000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '67000000-0000-4000-8000-000000000003',
  'STAY',
  '6d000000-0000-4000-8000-000000000001',
  'KITCHEN_CHARGE',
  5000,
  'NGN',
  'Kitchen Order #K-1003',
  '70000000-0000-4000-8000-000000000007',
  NOW() - INTERVAL '5 minutes',
  '70010000-0000-4000-8000-000000000003'
)
ON CONFLICT (id) DO NOTHING;

UPDATE kitchen_orders
SET charge_folio_line_item_id = '70030000-0000-4000-8000-000000000001',
    charge_posted_at = COALESCE(charge_posted_at, NOW() - INTERVAL '5 minutes'),
    updated_at = NOW()
WHERE id = '70010000-0000-4000-8000-000000000003'
  AND tenant_id = '11111111-1111-1111-1111-111111111111'
  AND property_id = '22222222-2222-2222-2222-222222222222';

COMMIT;
