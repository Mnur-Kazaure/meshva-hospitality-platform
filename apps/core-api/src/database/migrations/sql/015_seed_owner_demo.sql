-- Demo seed data for Owner Console Pack #5

BEGIN;

INSERT INTO users (id, tenant_id, full_name, email, auth_provider, status)
VALUES (
  '70000000-0000-4000-8000-000000000005',
  '11111111-1111-1111-1111-111111111111',
  'Portfolio Owner',
  'owner@meshva.com',
  'otp',
  'active'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO properties (id, tenant_id, name, state, city, status)
VALUES (
  '22222222-2222-2222-2222-222222222223',
  '11111111-1111-1111-1111-111111111111',
  'Meshva Dutse Suites',
  'Jigawa',
  'Dutse',
  'active'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO room_types (id, tenant_id, property_id, name, total_units)
VALUES
  (
    '33333333-3333-4333-8333-333333333334',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222223',
    'Standard',
    4
  ),
  (
    '44444444-4444-4444-8444-444444444445',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222223',
    'Deluxe',
    2
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO rooms (id, tenant_id, property_id, room_type_id, room_number, status)
VALUES
  (
    '50000000-0000-4000-8000-000000000009',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222223',
    '33333333-3333-4333-8333-333333333334',
    '101',
    'VACANT_READY'
  ),
  (
    '50000000-0000-4000-8000-000000000010',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222223',
    '33333333-3333-4333-8333-333333333334',
    '102',
    'VACANT_READY'
  ),
  (
    '50000000-0000-4000-8000-000000000011',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222223',
    '44444444-4444-4444-8444-444444444445',
    '201',
    'VACANT_READY'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_property_access (
  id,
  tenant_id,
  user_id,
  property_id,
  access_level,
  created_at,
  updated_at
)
VALUES
  (
    '71000000-0000-4000-8000-000000000005',
    '11111111-1111-1111-1111-111111111111',
    '70000000-0000-4000-8000-000000000005',
    '22222222-2222-2222-2222-222222222222',
    'manage',
    NOW(),
    NOW()
  ),
  (
    '71000000-0000-4000-8000-000000000006',
    '11111111-1111-1111-1111-111111111111',
    '70000000-0000-4000-8000-000000000005',
    '22222222-2222-2222-2222-222222222223',
    'manage',
    NOW(),
    NOW()
  )
ON CONFLICT (user_id, property_id) DO UPDATE
SET access_level = EXCLUDED.access_level,
    updated_at = NOW();

INSERT INTO invoices (
  id,
  tenant_id,
  property_id,
  invoice_number,
  issued_on,
  currency,
  status,
  created_at,
  updated_at
)
VALUES (
  '67000000-0000-4000-8000-000000000002',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222223',
  'INV-2223-5002',
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
VALUES (
  '68000000-0000-4000-8000-000000000003',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222223',
  '67000000-0000-4000-8000-000000000002',
  'RESERVATION',
  '63000000-0000-4000-8000-000000000001',
  'CHARGE',
  38000,
  'NGN',
  'Room charge - Standard Rack',
  '70000000-0000-4000-8000-000000000002',
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
  '69000000-0000-4000-8000-000000000002',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222223',
  '67000000-0000-4000-8000-000000000002',
  'BANK_TRANSFER',
  20000,
  'PAYMENT',
  'RECORDED',
  'TRF-2223-20001',
  'Transfer deposit',
  '70000000-0000-4000-8000-000000000003',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

WITH day_series AS (
  SELECT (CURRENT_DATE - offset_day)::date AS report_date, offset_day
  FROM generate_series(0, 6) AS offset_day
)
INSERT INTO daily_close_reports (
  id,
  tenant_id,
  property_id,
  date,
  status,
  expected_cash,
  expected_transfer,
  expected_pos,
  counted_cash,
  counted_transfer,
  counted_pos,
  variance_cash,
  variance_transfer,
  variance_pos,
  note,
  closed_by_user_id,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  day_series.report_date,
  'LOCKED',
  30000,
  10000,
  0,
  30000 + CASE WHEN day_series.offset_day = 2 THEN -500 ELSE 0 END,
  10000,
  0,
  CASE WHEN day_series.offset_day = 2 THEN -500 ELSE 0 END,
  0,
  0,
  CASE WHEN day_series.offset_day = 2 THEN 'Variance captured for owner risk feed' ELSE NULL END,
  '70000000-0000-4000-8000-000000000003',
  NOW(),
  NOW()
FROM day_series
ON CONFLICT (tenant_id, property_id, date) DO UPDATE
SET status = EXCLUDED.status,
    expected_cash = EXCLUDED.expected_cash,
    expected_transfer = EXCLUDED.expected_transfer,
    expected_pos = EXCLUDED.expected_pos,
    counted_cash = EXCLUDED.counted_cash,
    counted_transfer = EXCLUDED.counted_transfer,
    counted_pos = EXCLUDED.counted_pos,
    variance_cash = EXCLUDED.variance_cash,
    variance_transfer = EXCLUDED.variance_transfer,
    variance_pos = EXCLUDED.variance_pos,
    note = EXCLUDED.note,
    closed_by_user_id = EXCLUDED.closed_by_user_id,
    updated_at = NOW();

WITH day_series AS (
  SELECT (CURRENT_DATE - offset_day)::date AS report_date, offset_day
  FROM generate_series(0, 6) AS offset_day
  WHERE offset_day <> 5
)
INSERT INTO daily_close_reports (
  id,
  tenant_id,
  property_id,
  date,
  status,
  expected_cash,
  expected_transfer,
  expected_pos,
  counted_cash,
  counted_transfer,
  counted_pos,
  variance_cash,
  variance_transfer,
  variance_pos,
  note,
  closed_by_user_id,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222223',
  day_series.report_date,
  'LOCKED',
  12000,
  18000,
  0,
  12000,
  18000,
  0,
  0,
  0,
  0,
  NULL,
  '70000000-0000-4000-8000-000000000003',
  NOW(),
  NOW()
FROM day_series
ON CONFLICT (tenant_id, property_id, date) DO UPDATE
SET status = EXCLUDED.status,
    expected_cash = EXCLUDED.expected_cash,
    expected_transfer = EXCLUDED.expected_transfer,
    expected_pos = EXCLUDED.expected_pos,
    counted_cash = EXCLUDED.counted_cash,
    counted_transfer = EXCLUDED.counted_transfer,
    counted_pos = EXCLUDED.counted_pos,
    variance_cash = EXCLUDED.variance_cash,
    variance_transfer = EXCLUDED.variance_transfer,
    variance_pos = EXCLUDED.variance_pos,
    note = EXCLUDED.note,
    closed_by_user_id = EXCLUDED.closed_by_user_id,
    updated_at = NOW();

WITH day_series AS (
  SELECT (CURRENT_DATE - offset_day)::date AS control_date
  FROM generate_series(0, 6) AS offset_day
)
INSERT INTO day_controls (
  id,
  tenant_id,
  property_id,
  date,
  is_locked,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  day_series.control_date,
  true,
  NOW(),
  NOW()
FROM day_series
ON CONFLICT (tenant_id, property_id, date) DO UPDATE
SET is_locked = EXCLUDED.is_locked,
    updated_at = NOW();

WITH day_series AS (
  SELECT (CURRENT_DATE - offset_day)::date AS control_date
  FROM generate_series(0, 6) AS offset_day
  WHERE offset_day <> 5
)
INSERT INTO day_controls (
  id,
  tenant_id,
  property_id,
  date,
  is_locked,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222223',
  day_series.control_date,
  true,
  NOW(),
  NOW()
FROM day_series
ON CONFLICT (tenant_id, property_id, date) DO UPDATE
SET is_locked = EXCLUDED.is_locked,
    updated_at = NOW();

INSERT INTO owner_exceptions (
  id,
  tenant_id,
  property_id,
  type,
  severity,
  source_action,
  actor_user_id,
  entity_type,
  entity_id,
  summary,
  metadata_json,
  dedupe_key,
  created_at,
  updated_at
)
VALUES
  (
    '6e000000-0000-4000-8000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'DAILY_CLOSE_VARIANCE',
    'AMBER',
    'DAILY_CLOSE_COMPLETED',
    '70000000-0000-4000-8000-000000000003',
    'DailyCloseReport',
    '6e000000-0000-4000-8000-000000000011',
    'Daily close variance detected on Meshva Central Kano.',
    '{"varianceCash": -500, "varianceTransfer": 0, "variancePos": 0}'::jsonb,
    'DAILY_CLOSE_VARIANCE:22222222-2222-2222-2222-222222222222:' || CURRENT_DATE::text,
    NOW(),
    NOW()
  ),
  (
    '6e000000-0000-4000-8000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'DAY_UNLOCKED',
    'RED',
    'DAY_UNLOCKED_BY_MANAGER',
    '70000000-0000-4000-8000-000000000002',
    'DayControl',
    '6d000000-0000-4000-8000-000000000001',
    'Manager unlocked a closed day for correction.',
    '{"reason":"Late transfer correction"}'::jsonb,
    'DAY_UNLOCKED:22222222-2222-2222-2222-222222222222:' || CURRENT_DATE::text,
    NOW(),
    NOW()
  ),
  (
    '6e000000-0000-4000-8000-000000000003',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222223',
    'DISCOUNT_APPROVED',
    'AMBER',
    'DISCOUNT_APPLIED',
    '70000000-0000-4000-8000-000000000002',
    'FolioLineItem',
    '68000000-0000-4000-8000-000000000001',
    'Manager-approved discount applied.',
    '{}'::jsonb,
    NULL,
    NOW(),
    NOW()
  ),
  (
    '6e000000-0000-4000-8000-000000000004',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'REFUND_EXECUTED',
    'AMBER',
    'REFUND_EXECUTED',
    '70000000-0000-4000-8000-000000000003',
    'RefundExecution',
    '6f000000-0000-4000-8000-000000000001',
    'Finance executed approved refund.',
    '{"amount": 5000}'::jsonb,
    NULL,
    NOW(),
    NOW()
  ),
  (
    '6e000000-0000-4000-8000-000000000005',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222223',
    'INVENTORY_OVERRIDDEN',
    'AMBER',
    'INVENTORY_OVERRIDDEN',
    '70000000-0000-4000-8000-000000000002',
    'InventoryOverride',
    '6f000000-0000-4000-8000-000000000002',
    'Inventory override performed by manager.',
    '{"newAvailableUnits": 1}'::jsonb,
    NULL,
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO owner_notes (
  id,
  tenant_id,
  property_id,
  exception_id,
  text,
  created_by_user_id,
  created_at
)
VALUES (
  '6f000000-0000-4000-8000-000000000010',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '6e000000-0000-4000-8000-000000000001',
  'Variance acknowledged and flagged for weekly review.',
  '70000000-0000-4000-8000-000000000005',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO owner_export_jobs (
  id,
  tenant_id,
  requested_by_user_id,
  export_type,
  format,
  from_date,
  to_date,
  property_ids,
  filters_json,
  status,
  download_url,
  created_at,
  updated_at,
  completed_at
)
VALUES (
  '6f000000-0000-4000-8000-000000000020',
  '11111111-1111-1111-1111-111111111111',
  '70000000-0000-4000-8000-000000000005',
  'DAILY_CLOSE_COMPLIANCE',
  'CSV',
  CURRENT_DATE - 6,
  CURRENT_DATE,
  ARRAY[
    '22222222-2222-2222-2222-222222222222'::uuid,
    '22222222-2222-2222-2222-222222222223'::uuid
  ],
  '{"from":"last7days"}'::jsonb,
  'COMPLETED',
  'https://example.local/owner-exports/daily-close-compliance.csv',
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

COMMIT;
