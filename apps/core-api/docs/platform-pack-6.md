# Platform Admin Console Pack #6 - Implementation Notes

## Required Request Headers
- `x-tenant-id`
- `x-user-id`
- `x-role` (optional)
- `x-permissions`
- `Idempotency-Key` for platform mutation routes

## Platform Admin Endpoints

### Tenant Governance
- `GET /v1/platform/tenants`
- `GET /v1/platform/tenants/:tenantId`
- `POST /v1/platform/tenants`
- `POST /v1/platform/tenants/:tenantId/suspend`
- `POST /v1/platform/tenants/:tenantId/reactivate`
- `POST /v1/platform/tenants/:tenantId/assign-plan`
- `GET /v1/platform/tenants/:tenantId/feature-flags`
- `POST /v1/platform/tenants/:tenantId/feature-flags`
- `GET /v1/platform/tenants/:tenantId/metrics`

### Subscription Plans
- `GET /v1/platform/subscription-plans`
- `POST /v1/platform/subscription-plans`
- `PATCH /v1/platform/subscription-plans/:planId`

### System + Audit + Support
- `GET /v1/platform/system/health`
- `GET /v1/platform/audit`
- `POST /v1/platform/tenants/:tenantId/impersonate`
- `POST /v1/platform/impersonations/:sessionId/end`
- `POST /v1/platform/users/:userId/reset-password`

## Guard Rails Implemented
- Platform routes are RBAC-protected with `PLATFORM_ADMIN.*` permissions.
- Idempotency enforced on all platform mutation routes.
- Tenant suspension guard blocks non-platform writes while allowing platform governance actions.
- Impersonation is explicit (start/end), time-bounded, and fully audited.
- Every platform mutation writes immutable audit logs.

## Persistence
- New migration files:
  - `src/database/migrations/sql/016_platform_pack_6.sql`
  - `src/database/migrations/sql/017_seed_platform_permissions.sql`
  - `src/database/migrations/sql/018_seed_platform_demo.sql`

## Seed Context
- Platform admin user: `70000000-0000-4000-8000-000000000099`
- Secondary demo tenant: `11111111-1111-1111-1111-111111111112`
- Starter/Standard/Pro/Custom plans: `72000000-0000-4000-8000-000000000001..0004`
