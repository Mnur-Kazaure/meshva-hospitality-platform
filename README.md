# meshva-hospitality

Multi-tenant, multi-property hotel booking and enterprise management platform.

## Stack
- Backend: NestJS (`apps/core-api`)
- Frontend: Next.js web apps (`apps/web-*`)
- Database: PostgreSQL
- Queue: Redis + BullMQ

## Phase Status
- Phase 1 / Dashboard Pack #1 initialized:
  - `apps/core-api`: Front Desk API scaffolding with tenant scope guard, RBAC guard, audit logging, idempotency handling.
  - `apps/web-front-desk`: Web-first IA shell for Today Board, Room Board, Reservations, Assisted Booking, Check-in/Checkout, Guests, Confirmations, Shift Handover.
  - Postgres persistence baseline added:
    - schema migration: `apps/core-api/src/database/migrations/sql/001_front_desk_pack_1.sql`
    - demo seed: `apps/core-api/src/database/migrations/sql/002_seed_front_desk_demo.sql`
    - repository adapter switch via `PERSISTENCE_MODE=memory|postgres`
- Phase 1 / Dashboard Pack #2 initialized:
  - `apps/core-api`: Manager Console APIs for approvals, rate plans, inventory controls, reservation overrides, staff activity audit query, and day unlock governance.
  - `apps/web-manager`: Web-first Manager Console IA shell with sealed routes.
  - Postgres extensions:
    - schema migration: `apps/core-api/src/database/migrations/sql/004_manager_pack_2.sql`
    - permissions seed: `apps/core-api/src/database/migrations/sql/005_seed_manager_permissions.sql`
    - demo seed: `apps/core-api/src/database/migrations/sql/006_seed_manager_demo.sql`
- Phase 1 / Dashboard Pack #3 initialized:
  - `apps/core-api`: Cashier & Finance APIs for invoices, folio adjustments, payments, approved-refund execution, daily close locking, and finance shift handover.
  - `apps/web-finance`: Web-first Cashier & Finance IA shell with sealed routes.
  - Postgres extensions:
    - schema migration: `apps/core-api/src/database/migrations/sql/007_finance_pack_3.sql`
    - permissions seed: `apps/core-api/src/database/migrations/sql/008_seed_finance_permissions.sql`
    - demo seed: `apps/core-api/src/database/migrations/sql/009_seed_finance_demo.sql`
- Phase 1 / Dashboard Pack #4 initialized:
  - `apps/core-api`: Housekeeping + Maintenance APIs for task progression (`DIRTY -> CLEANING -> CLEAN -> READY`), task assignment, and maintenance ticket reporting.
  - Postgres extensions:
    - schema migration: `apps/core-api/src/database/migrations/sql/010_housekeeping_pack_4.sql`
    - permissions seed: `apps/core-api/src/database/migrations/sql/011_seed_housekeeping_permissions.sql`
    - demo seed: `apps/core-api/src/database/migrations/sql/012_seed_housekeeping_demo.sql`
- Phase 1 / Dashboard Pack #5 initialized:
  - `apps/core-api`: Owner Console APIs for portfolio overview, property comparison, risk exceptions, tenant audit viewer, and export jobs.
  - Postgres extensions:
    - schema migration: `apps/core-api/src/database/migrations/sql/013_owner_pack_5.sql`
    - permissions seed: `apps/core-api/src/database/migrations/sql/014_seed_owner_permissions.sql`
    - demo seed: `apps/core-api/src/database/migrations/sql/015_seed_owner_demo.sql`
- Phase 1 / Dashboard Pack #6 initialized:
  - `apps/core-api`: Platform Admin Console APIs for tenant onboarding, tenant suspension/reactivation, subscription plan controls, tenant feature flags, support impersonation, global audit, and system health.
  - Postgres extensions:
    - schema migration: `apps/core-api/src/database/migrations/sql/016_platform_pack_6.sql`
    - permissions seed: `apps/core-api/src/database/migrations/sql/017_seed_platform_permissions.sql`
    - demo seed: `apps/core-api/src/database/migrations/sql/018_seed_platform_demo.sql`
- Phase 1 / Dashboard Pack #7 initialized:
  - `apps/core-api`: Guest Portal APIs for public search/property details/booking and authenticated guest booking management (view/modify/cancel/profile).
  - Postgres extensions:
    - schema migration: `apps/core-api/src/database/migrations/sql/019_guest_pack_7.sql`
    - permissions seed: `apps/core-api/src/database/migrations/sql/020_seed_guest_permissions.sql`
    - demo seed: `apps/core-api/src/database/migrations/sql/021_seed_guest_demo.sql`
- Phase 1 / Dashboard Pack #8 initialized:
  - `apps/web-kitchen`: Kitchen & Restaurant web app implemented with FSD + Clean Architecture boundaries (`shared -> entities -> features -> widgets -> app`).
  - Contracts extensions:
    - kitchen dto: `packages/contracts/src/dto/kitchen/*`
    - kitchen enums/events/permissions: `packages/contracts/src/enums/kitchen-order-status.ts`, `packages/contracts/src/events/kitchen-events.ts`, `packages/contracts/src/permissions/kitchen.ts`
  - Backend note: `apps/core-api/src/modules/kitchen/kitchen.module.ts` is currently a module skeleton; Kitchen API endpoints/services are pending backend implementation.
- Day 1 / Phase 2 onboarding support initialized:
  - `apps/core-api`: migration `sql/022_day1_phase2_support.sql` (manual import source + housekeeping onboarding compatibility).
  - `scripts/ops/day1-phase2-import.mjs`: CSV-driven importer for in-house stays, future reservations, opening balances, and room-status capture.
- Database Schema Blueprint / Pack A initialized:
  - `apps/core-api`: migration `sql/024_pack_a_schema_authority.sql` (authoritative schema hardening: scoped integrity, immutable ledger guards, inventory calendar, and core index strategy).
- System Architecture and Data Flow / Pack B initialized:
  - `docs/platform/system-architecture-data-flow-blueprint.md` (authoritative runtime architecture, request lifecycle, event model, and end-to-end flow contract).

## Getting started
1. Export dependency-registry variables (`NPM_REGISTRY_URL`, `NPM_REGISTRY_HOST`, optional `NPM_TOKEN`).
2. One-time only (if lockfile is absent): `pnpm deps:bootstrap-lockfile`
3. Prepare deterministic deps: `pnpm deps:prepare-offline`
4. Start infra (to be finalized): `docker compose -f infra/docker/docker-compose.yml up -d`
5. Start apps: `pnpm dev`

## Dependency Governance
- Internal registry only (no direct public npm resolution): `.npmrc`
- Toolchain pinned: `.node-version`, `.nvmrc`, `packageManager`
- Deterministic install path:
  - `pnpm fetch --frozen-lockfile`
  - `pnpm install --offline --frozen-lockfile`
- Validation script: `pnpm deps:verify`
- Lockfile bootstrap script: `pnpm deps:bootstrap-lockfile`
- Full runbook: `docs/platform/dependency-governance.md`
- One-time bootstrap: generate and commit `pnpm-lock.yaml` from trusted internal-registry environment.

## Brand Asset Standard
- Canonical source: `packages/ui/assets/brand/`
- Required files:
  - `meshva-logo.svg`
  - `meshva-logo.png`
- Sync assets into dashboard apps: `pnpm brand:sync`
- Verify sync integrity: `pnpm brand:check`
- Root build enforces sync automatically (`pnpm build` runs `brand:sync` first).

## API Header Contract (Current Scaffold)
- `x-tenant-id`
- `x-user-id`
- `x-role` (optional)
- `x-permissions` (comma-separated permission codes)
- `Idempotency-Key` for idempotent mutation routes

## Seeded Tenant/Property
- `tenant_id`: `11111111-1111-1111-1111-111111111111`
- `property_id`: `22222222-2222-2222-2222-222222222222`

## Front Desk Pack Documentation
- `apps/core-api/docs/front-desk-pack-1.md`

## Manager Pack Documentation
- `apps/core-api/docs/manager-pack-2.md`

## Finance Pack Documentation
- `apps/core-api/docs/finance-pack-3.md`

## Housekeeping Pack Documentation
- `apps/core-api/docs/housekeeping-pack-4.md`

## Owner Pack Documentation
- `apps/core-api/docs/owner-pack-5.md`

## Platform Admin Pack Documentation
- `apps/core-api/docs/platform-pack-6.md`

## Guest Portal Pack Documentation
- `apps/core-api/docs/guest-pack-7.md`

## Kitchen Pack Documentation
- `apps/web-kitchen/README.md`

## Guest Portal Smoke Test
- Script: `scripts/smoke/guest-pack7-smoke.sh`
- Purpose: end-to-end Pack #7 check (public booking + guest modify/cancel/profile + idempotency assertions)
- Run:
  - `./scripts/smoke/guest-pack7-smoke.sh`

## Pack A Schema Smoke Test
- Script: `scripts/smoke/pack-a-schema-smoke.sh`
- Purpose: authoritative schema integrity checks (Pack A columns/triggers/indexes + invoice total sync + immutable delete guard)
- Run:
  - `pnpm smoke:pack-a`

## Backend QA Smoke Suite
- Auth + RBAC smoke: `pnpm smoke:auth`
- Guest workflow smoke: `pnpm smoke:guest-pack7`
- Operations E2E smoke (reservation -> housekeeping -> kitchen -> finance): `pnpm smoke:ops-e2e`
- Governance smoke (manager/owner/platform): `pnpm smoke:governance`
- Full backend production-readiness sequence: `pnpm smoke:backend-prod`
- Master QA hardening gate (negative-path + observability + concurrency sanity): `pnpm smoke:qa-master`
- Detailed playbook: `docs/platform/backend-qa-production-readiness.md`

## Playwright UI E2E (Guest + Cross-Dashboard Routing)
- Local database bootstrap (idempotent by default):
  - `pnpm e2e:db:bootstrap`
- Local run (starts API + all dashboard apps via Playwright `webServer`):
  - `pnpm e2e`
- Headed mode:
  - `pnpm e2e:headed`
- CI reporter mode (GitHub annotations + HTML report):
  - `pnpm e2e:ci`
- Browser install:
  - `pnpm e2e:install`
- Scripts:
  - `scripts/e2e/bootstrap-db.sh`
  - `scripts/e2e/start-api.sh`
  - `scripts/e2e/start-web-apps.sh`
- Default seeded credentials used by tests:
  - Staff: `manager@meshva.com`, `frontdesk@meshva.com`, `finance@meshva.com`, `housekeeping@meshva.com`, `owner@meshva.com`, `platform.admin@meshva.com`, `kitchen@meshva.com`
  - Guest: `amina.guest@meshva.demo`
  - Password: `Meshva123!`

## Observability Baseline
- Public runtime endpoints (no auth required):
  - `GET /v1/health` (liveness)
  - `GET /v1/ready` (readiness: app + db + queue)
  - `GET /v1/metrics` (Prometheus text format)
- Request correlation:
  - Accepts `x-request-id` from caller; generates one if absent.
  - Echoes `x-request-id` in response headers.
- Structured request logs:
  - JSON logs include `timestamp`, `level`, `service`, `environment`, `requestId`, `tenantId`, `propertyId`, `userId`, `route`, `action`, `statusCode`, `durationMs`.

## Pack B Architecture Blueprint
- Document: `docs/platform/system-architecture-data-flow-blueprint.md`
- Purpose: sealed system architecture, domain module map, request lifecycle, event model, and cross-dashboard data flow contract.

## Observability Runbook
- Document: `docs/platform/backend-observability-monitoring.md`
- Purpose: runtime probes, structured logs, request correlation, and Prometheus metrics baseline for production operations.

## Day 1 Onboarding + Switch-over Operations
- Runbook: `docs/operations/day1-onboarding-switch-over-pack.md`
- Readiness script: `scripts/ops/day1-onboarding-readiness.sh`
- Phase 2 import script: `scripts/ops/day1-phase2-import.mjs`
- Env template: `scripts/ops/day1-onboarding.env.example`
- Command:
  - `pnpm ops:day1:check`
  - `pnpm ops:day1:import -- --mode all`
