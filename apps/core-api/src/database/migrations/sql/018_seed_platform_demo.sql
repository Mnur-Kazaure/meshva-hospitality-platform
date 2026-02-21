-- Demo seed for Platform Admin Pack #6

BEGIN;

INSERT INTO users (id, tenant_id, full_name, email, auth_provider, status)
VALUES (
  '70000000-0000-4000-8000-000000000099',
  '11111111-1111-1111-1111-111111111111',
  'Platform Administrator',
  'platform.admin@meshva.com',
  'otp',
  'active'
)
ON CONFLICT (id) DO UPDATE
SET full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    auth_provider = EXCLUDED.auth_provider,
    status = EXCLUDED.status,
    updated_at = NOW();

INSERT INTO tenants (id, name, country, state, city, timezone, status)
VALUES (
  '11111111-1111-1111-1111-111111111112',
  'Northern Axis Hotels',
  'NG',
  'Katsina',
  'Katsina',
  'Africa/Lagos',
  'pending'
)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    country = EXCLUDED.country,
    state = EXCLUDED.state,
    city = EXCLUDED.city,
    timezone = EXCLUDED.timezone,
    status = EXCLUDED.status,
    updated_at = NOW();

INSERT INTO properties (id, tenant_id, name, state, city, status)
VALUES (
  '22222222-2222-2222-2222-222222222224',
  '11111111-1111-1111-1111-111111111112',
  'Northern Axis Katsina',
  'Katsina',
  'Katsina',
  'active'
)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    state = EXCLUDED.state,
    city = EXCLUDED.city,
    status = EXCLUDED.status,
    updated_at = NOW();

INSERT INTO users (id, tenant_id, full_name, email, phone, auth_provider, status)
VALUES (
  '70000000-0000-4000-8000-000000000098',
  '11111111-1111-1111-1111-111111111112',
  'Northern Axis Owner',
  'owner@northernaxis.com',
  '+2348015550100',
  'otp',
  'active'
)
ON CONFLICT (id) DO UPDATE
SET full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    auth_provider = EXCLUDED.auth_provider,
    status = EXCLUDED.status,
    updated_at = NOW();

INSERT INTO subscription_plans (
  id,
  code,
  name,
  description,
  property_limit,
  user_limit,
  features_json,
  is_active
)
VALUES
  (
    '72000000-0000-4000-8000-000000000001',
    'STARTER',
    'Starter',
    'Reception + basic reservations + WhatsApp confirmations',
    1,
    10,
    '{"kitchen_enabled": false, "advanced_reporting_enabled": false, "owner_notes_enabled": false}'::jsonb,
    true
  ),
  (
    '72000000-0000-4000-8000-000000000002',
    'STANDARD',
    'Standard',
    'Housekeeping + finance + reporting',
    3,
    40,
    '{"kitchen_enabled": true, "advanced_reporting_enabled": false, "owner_notes_enabled": true}'::jsonb,
    true
  ),
  (
    '72000000-0000-4000-8000-000000000003',
    'PRO',
    'Pro',
    'Multi-property + corporate accounts + advanced reporting',
    25,
    300,
    '{"kitchen_enabled": true, "advanced_reporting_enabled": true, "owner_notes_enabled": true}'::jsonb,
    true
  ),
  (
    '72000000-0000-4000-8000-000000000004',
    'CUSTOM',
    'Custom',
    'Custom contract with bespoke limits and feature flags',
    100,
    1000,
    '{"kitchen_enabled": true, "advanced_reporting_enabled": true, "owner_notes_enabled": true}'::jsonb,
    true
  )
ON CONFLICT (id) DO UPDATE
SET code = EXCLUDED.code,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    property_limit = EXCLUDED.property_limit,
    user_limit = EXCLUDED.user_limit,
    features_json = EXCLUDED.features_json,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

UPDATE tenant_subscriptions
SET status = 'INACTIVE',
    effective_to = COALESCE(effective_to, CURRENT_DATE),
    updated_at = NOW()
WHERE tenant_id = '11111111-1111-1111-1111-111111111111'
  AND status = 'ACTIVE'
  AND id <> '73000000-0000-4000-8000-000000000001';

INSERT INTO tenant_subscriptions (
  id,
  tenant_id,
  subscription_plan_id,
  effective_from,
  status,
  created_by_user_id
)
VALUES (
  '73000000-0000-4000-8000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  '72000000-0000-4000-8000-000000000002',
  CURRENT_DATE,
  'ACTIVE',
  '70000000-0000-4000-8000-000000000099'
)
ON CONFLICT (id) DO UPDATE
SET subscription_plan_id = EXCLUDED.subscription_plan_id,
    effective_from = EXCLUDED.effective_from,
    effective_to = NULL,
    status = EXCLUDED.status,
    created_by_user_id = EXCLUDED.created_by_user_id,
    updated_at = NOW();

UPDATE tenant_subscriptions
SET status = 'INACTIVE',
    effective_to = COALESCE(effective_to, CURRENT_DATE),
    updated_at = NOW()
WHERE tenant_id = '11111111-1111-1111-1111-111111111112'
  AND status = 'ACTIVE'
  AND id <> '73000000-0000-4000-8000-000000000002';

INSERT INTO tenant_subscriptions (
  id,
  tenant_id,
  subscription_plan_id,
  effective_from,
  status,
  created_by_user_id
)
VALUES (
  '73000000-0000-4000-8000-000000000002',
  '11111111-1111-1111-1111-111111111112',
  '72000000-0000-4000-8000-000000000001',
  CURRENT_DATE,
  'ACTIVE',
  '70000000-0000-4000-8000-000000000099'
)
ON CONFLICT (id) DO UPDATE
SET subscription_plan_id = EXCLUDED.subscription_plan_id,
    effective_from = EXCLUDED.effective_from,
    effective_to = NULL,
    status = EXCLUDED.status,
    created_by_user_id = EXCLUDED.created_by_user_id,
    updated_at = NOW();

INSERT INTO tenant_feature_flags (
  id,
  tenant_id,
  key,
  enabled,
  config_json,
  updated_by_user_id
)
VALUES
  (
    '74000000-0000-4000-8000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'kitchen_enabled',
    true,
    '{}'::jsonb,
    '70000000-0000-4000-8000-000000000099'
  ),
  (
    '74000000-0000-4000-8000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    'advanced_reporting_enabled',
    false,
    '{}'::jsonb,
    '70000000-0000-4000-8000-000000000099'
  ),
  (
    '74000000-0000-4000-8000-000000000003',
    '11111111-1111-1111-1111-111111111111',
    'owner_notes_enabled',
    true,
    '{}'::jsonb,
    '70000000-0000-4000-8000-000000000099'
  )
ON CONFLICT (tenant_id, key) DO UPDATE
SET enabled = EXCLUDED.enabled,
    config_json = EXCLUDED.config_json,
    updated_by_user_id = EXCLUDED.updated_by_user_id,
    updated_at = NOW();

INSERT INTO impersonation_sessions (
  id,
  tenant_id,
  target_user_id,
  token,
  status,
  started_by_user_id,
  started_at,
  expires_at,
  reason
)
VALUES (
  '75000000-0000-4000-8000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  '70000000-0000-4000-8000-000000000005',
  'platform-demo-token-001',
  'ENDED',
  '70000000-0000-4000-8000-000000000099',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '23 hours',
  'Demo support verification session'
)
ON CONFLICT (id) DO UPDATE
SET status = EXCLUDED.status,
    ended_at = COALESCE(impersonation_sessions.ended_at, NOW() - INTERVAL '22 hours'),
    ended_by_user_id = '70000000-0000-4000-8000-000000000099',
    reason = EXCLUDED.reason;

COMMIT;
