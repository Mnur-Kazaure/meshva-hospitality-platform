# Postgres Migrations - Front Desk through Day 1 Onboarding Support

## Files
- `sql/001_front_desk_pack_1.sql`: baseline schema
- `sql/002_seed_front_desk_demo.sql`: local demo seed
- `sql/003_seed_front_desk_permissions.sql`: Front Desk permission codes
- `sql/004_manager_pack_2.sql`: manager schema extensions (approvals, rates, inventory controls)
- `sql/005_seed_manager_permissions.sql`: manager + approval permission codes
- `sql/006_seed_manager_demo.sql`: manager demo seed data
- `sql/007_finance_pack_3.sql`: finance schema extensions (invoices, payments, daily close, finance handover)
- `sql/008_seed_finance_permissions.sql`: finance permission codes
- `sql/009_seed_finance_demo.sql`: finance demo seed data
- `sql/010_housekeeping_pack_4.sql`: housekeeping/maintenance schema extensions and room status workflow
- `sql/011_seed_housekeeping_permissions.sql`: housekeeping + maintenance permission codes
- `sql/012_seed_housekeeping_demo.sql`: housekeeping demo seed data
- `sql/013_owner_pack_5.sql`: owner schema extensions (exceptions, notes, export jobs)
- `sql/014_seed_owner_permissions.sql`: owner permission codes
- `sql/015_seed_owner_demo.sql`: owner multi-property demo seed data
- `sql/016_platform_pack_6.sql`: platform admin schema extensions (tenants, subscriptions, feature flags, impersonation)
- `sql/017_seed_platform_permissions.sql`: platform admin permission codes
- `sql/018_seed_platform_demo.sql`: platform demo seed data
- `sql/019_guest_pack_7.sql`: guest portal schema extensions
- `sql/020_seed_guest_permissions.sql`: guest permission codes
- `sql/021_seed_guest_demo.sql`: guest demo seed data
- `sql/022_day1_phase2_support.sql`: Day 1 onboarding support (manual import booking source + housekeeping task compatibility)
- `sql/023_seed_uuid_v4_room_types.sql`: normalize seeded room type IDs to UUID v4-compatible values (strict DTO validation compatibility)
- `sql/024_pack_a_schema_authority.sql`: Pack A production schema authority (core enrichments, scoped relational guards, immutable-ledger delete protections, performance indexes)
- `sql/025_kitchen_pack_8.sql`: kitchen schema extensions (menu, kitchen orders/items, folio reference linkage)
- `sql/026_seed_kitchen_permissions.sql`: kitchen + manager kitchen permission codes
- `sql/027_seed_kitchen_demo.sql`: kitchen demo seed data
- `sql/028_auth_pack_v1_schema.sql`: auth schema hardening (guest identities, refresh rotation sessions, staff invites, MFA scaffolding)
- `sql/029_seed_auth_roles_permissions.sql`: staff management permission codes + tenant role alignment seed
- `sql/030_seed_auth_demo.sql`: auth demo normalization + global guest auth seed

## Run manually

```bash
psql "$DATABASE_URL" -f apps/core-api/src/database/migrations/sql/001_front_desk_pack_1.sql
psql "$DATABASE_URL" -f apps/core-api/src/database/migrations/sql/002_seed_front_desk_demo.sql
psql "$DATABASE_URL" -f apps/core-api/src/database/migrations/sql/003_seed_front_desk_permissions.sql
psql "$DATABASE_URL" -f apps/core-api/src/database/migrations/sql/004_manager_pack_2.sql
psql "$DATABASE_URL" -f apps/core-api/src/database/migrations/sql/005_seed_manager_permissions.sql
psql "$DATABASE_URL" -f apps/core-api/src/database/migrations/sql/006_seed_manager_demo.sql
psql "$DATABASE_URL" -f apps/core-api/src/database/migrations/sql/007_finance_pack_3.sql
psql "$DATABASE_URL" -f apps/core-api/src/database/migrations/sql/008_seed_finance_permissions.sql
psql "$DATABASE_URL" -f apps/core-api/src/database/migrations/sql/009_seed_finance_demo.sql
psql "$DATABASE_URL" -f apps/core-api/src/database/migrations/sql/010_housekeeping_pack_4.sql
psql "$DATABASE_URL" -f apps/core-api/src/database/migrations/sql/011_seed_housekeeping_permissions.sql
psql "$DATABASE_URL" -f apps/core-api/src/database/migrations/sql/012_seed_housekeeping_demo.sql
psql "$DATABASE_URL" -f apps/core-api/src/database/migrations/sql/013_owner_pack_5.sql
psql "$DATABASE_URL" -f apps/core-api/src/database/migrations/sql/014_seed_owner_permissions.sql
psql "$DATABASE_URL" -f apps/core-api/src/database/migrations/sql/015_seed_owner_demo.sql
psql "$DATABASE_URL" -f apps/core-api/src/database/migrations/sql/016_platform_pack_6.sql
psql "$DATABASE_URL" -f apps/core-api/src/database/migrations/sql/017_seed_platform_permissions.sql
psql "$DATABASE_URL" -f apps/core-api/src/database/migrations/sql/018_seed_platform_demo.sql
psql "$DATABASE_URL" -f apps/core-api/src/database/migrations/sql/019_guest_pack_7.sql
psql "$DATABASE_URL" -f apps/core-api/src/database/migrations/sql/020_seed_guest_permissions.sql
psql "$DATABASE_URL" -f apps/core-api/src/database/migrations/sql/021_seed_guest_demo.sql
psql "$DATABASE_URL" -f apps/core-api/src/database/migrations/sql/022_day1_phase2_support.sql
psql "$DATABASE_URL" -f apps/core-api/src/database/migrations/sql/023_seed_uuid_v4_room_types.sql
psql "$DATABASE_URL" -f apps/core-api/src/database/migrations/sql/024_pack_a_schema_authority.sql
psql "$DATABASE_URL" -f apps/core-api/src/database/migrations/sql/025_kitchen_pack_8.sql
psql "$DATABASE_URL" -f apps/core-api/src/database/migrations/sql/026_seed_kitchen_permissions.sql
psql "$DATABASE_URL" -f apps/core-api/src/database/migrations/sql/027_seed_kitchen_demo.sql
psql "$DATABASE_URL" -f apps/core-api/src/database/migrations/sql/028_auth_pack_v1_schema.sql
psql "$DATABASE_URL" -f apps/core-api/src/database/migrations/sql/029_seed_auth_roles_permissions.sql
psql "$DATABASE_URL" -f apps/core-api/src/database/migrations/sql/030_seed_auth_demo.sql
```

## Persistence Mode
Set `PERSISTENCE_MODE=postgres` to activate Postgres repository adapter.
Default is `memory`.
