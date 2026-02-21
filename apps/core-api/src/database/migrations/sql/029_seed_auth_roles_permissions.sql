-- Auth Pack v1 role + permission seeding

BEGIN;

INSERT INTO permissions (id, code, description)
VALUES
  (gen_random_uuid(), 'MANAGER.STAFF_VIEW', 'View staff in property scope'),
  (gen_random_uuid(), 'MANAGER.STAFF_CREATE', 'Create staff users'),
  (gen_random_uuid(), 'MANAGER.STAFF_UPDATE', 'Update staff users and assignments'),
  (gen_random_uuid(), 'MANAGER.STAFF_DEACTIVATE', 'Deactivate staff accounts'),
  (gen_random_uuid(), 'MANAGER.STAFF_ACTIVATE', 'Activate staff accounts'),
  (gen_random_uuid(), 'MANAGER.STAFF_RESET_PASSWORD', 'Reset staff credentials'),
  (gen_random_uuid(), 'MANAGER.STAFF_DELETE', 'Soft delete staff accounts')
ON CONFLICT (code) DO NOTHING;

INSERT INTO roles (id, tenant_id, name, description)
SELECT gen_random_uuid(), t.id, role_name, role_name || ' role'
FROM tenants t
CROSS JOIN (
  VALUES
    ('PlatformAdmin'),
    ('Owner'),
    ('Manager'),
    ('FrontDesk'),
    ('Finance'),
    ('Housekeeping'),
    ('Guest'),
    ('Kitchen')
) AS role_seed(role_name)
ON CONFLICT (tenant_id, name) DO NOTHING;

INSERT INTO role_permissions (id, tenant_id, role_id, permission_id)
SELECT
  gen_random_uuid(),
  r.tenant_id,
  r.id,
  p.id
FROM roles r
JOIN permissions p ON (
  (r.name = 'PlatformAdmin' AND p.code LIKE 'PLATFORM_ADMIN.%')
  OR
  (r.name = 'Owner' AND (
      p.code LIKE 'OWNER.%'
      OR p.code IN (
        'MANAGER.STAFF_VIEW',
        'MANAGER.STAFF_CREATE',
        'MANAGER.STAFF_UPDATE',
        'MANAGER.STAFF_DEACTIVATE',
        'MANAGER.STAFF_ACTIVATE',
        'MANAGER.STAFF_RESET_PASSWORD',
        'MANAGER.STAFF_DELETE'
      )
    ))
  OR
  (r.name = 'Manager' AND p.code LIKE 'MANAGER.%')
  OR
  (r.name = 'FrontDesk' AND p.code LIKE 'FRONT_DESK.%')
  OR
  (r.name = 'Finance' AND p.code LIKE 'FINANCE.%')
  OR
  (r.name = 'Housekeeping' AND p.code LIKE 'HOUSEKEEPING.%')
  OR
  (r.name = 'Guest' AND p.code LIKE 'GUEST.%')
  OR
  (r.name = 'Kitchen' AND p.code LIKE 'KITCHEN.%')
)
LEFT JOIN role_permissions rp
  ON rp.role_id = r.id
 AND rp.permission_id = p.id
WHERE rp.id IS NULL;

-- Seed role assignments for existing demo users.
INSERT INTO user_roles (id, tenant_id, user_id, role_id)
SELECT
  gen_random_uuid(),
  u.tenant_id,
  u.id,
  r.id
FROM users u
JOIN roles r
  ON r.tenant_id = u.tenant_id
 AND (
   (lower(u.email) = 'frontdesk@meshva.com' AND r.name = 'FrontDesk') OR
   (lower(u.email) = 'manager@meshva.com' AND r.name = 'Manager') OR
   (lower(u.email) = 'finance@meshva.com' AND r.name = 'Finance') OR
   (lower(u.email) = 'housekeeping@meshva.com' AND r.name = 'Housekeeping') OR
   (lower(u.email) = 'kitchen@meshva.com' AND r.name = 'Kitchen') OR
   (lower(u.email) = 'platform.admin@meshva.com' AND r.name = 'PlatformAdmin') OR
   (lower(u.email) LIKE 'owner%@%' AND r.name = 'Owner')
 )
LEFT JOIN user_roles ur
  ON ur.user_id = u.id
 AND ur.role_id = r.id
WHERE ur.id IS NULL;

INSERT INTO user_property_access (
  id,
  tenant_id,
  user_id,
  property_id,
  access_level,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  u.tenant_id,
  u.id,
  p.id,
  CASE
    WHEN lower(u.email) IN ('manager@meshva.com', 'owner@meshva.com', 'owner@northernaxis.com')
      THEN 'manage'
    ELSE 'operate'
  END,
  NOW(),
  NOW()
FROM users u
JOIN properties p
  ON p.tenant_id = u.tenant_id
WHERE lower(u.email) IN (
  'frontdesk@meshva.com',
  'manager@meshva.com',
  'finance@meshva.com',
  'housekeeping@meshva.com',
  'kitchen@meshva.com',
  'owner@meshva.com',
  'owner@northernaxis.com'
)
ON CONFLICT (user_id, property_id) DO UPDATE
SET access_level = EXCLUDED.access_level,
    updated_at = NOW();

COMMIT;
