-- Seed permission codes for Platform Admin Pack #6

BEGIN;

INSERT INTO permissions (id, code, description)
VALUES
  (gen_random_uuid(), 'PLATFORM_ADMIN.TENANT_CREATE', 'Create and onboard tenants'),
  (gen_random_uuid(), 'PLATFORM_ADMIN.TENANT_SUSPEND', 'Suspend or reactivate tenants'),
  (gen_random_uuid(), 'PLATFORM_ADMIN.SUBSCRIPTION_MANAGE', 'Manage subscription plans and tenant plan assignments'),
  (gen_random_uuid(), 'PLATFORM_ADMIN.FEATURE_FLAG_MANAGE', 'Manage tenant feature flags'),
  (gen_random_uuid(), 'PLATFORM_ADMIN.SYSTEM_VIEW', 'View platform system health and tenant metrics'),
  (gen_random_uuid(), 'PLATFORM_ADMIN.IMPERSONATE', 'Start and end support impersonation sessions'),
  (gen_random_uuid(), 'PLATFORM_ADMIN.AUDIT_VIEW', 'View global audit logs across tenants'),
  (gen_random_uuid(), 'PLATFORM_ADMIN.USER_RESET', 'Reset tenant user passwords for support')
ON CONFLICT (code) DO NOTHING;

COMMIT;
