# Day 1 Onboarding + Switch-Over Pack

Production deployment runbook for a real property migration to Meshva in one controlled transition.

## Scope
- Multi-tenant, multi-property Meshva deployment.
- Web-first operations with WhatsApp-first communication.
- Jigawa/Kano/Katsina operational constraints (mixed digital maturity, low-IT workflows).

## Primary objective
- Zero operational paralysis at switch-over.
- Minimal revenue risk.
- Immediate role-based usability.
- Audit integrity from first live transaction.

## Phase 0: Platform Admin pre-deployment
Actions:
- Create tenant and initial property.
- Assign active subscription plan.
- Enable required feature flags.
- Verify timezone and locale defaults.
- Verify owner account login.

System evidence:
- `GET /v1/platform/tenants/:tenantId`
- `GET /v1/platform/tenants/:tenantId/feature-flags`

Gate:
- Tenant status is `active`.
- At least one property exists.
- Active subscription exists.

## Phase 1: Property configuration (Manager)
Actions:
- Configure room types and rooms.
- Configure baseline rate plans.
- Confirm staff role access (front desk, finance, housekeeping; kitchen if enabled).
- Confirm policy setup (check-in/out, cancellation, deposit).

System evidence:
- `GET /v1/properties/:propertyId/rooms/board`
- `GET /v1/properties/:propertyId/manager/overview`
- `GET /v1/properties/:propertyId/finance/overview`
- `GET /v1/properties/:propertyId/housekeeping/rooms/status-board`

Gate:
- Room board is non-empty.
- Manager, front desk, finance, housekeeping endpoints are reachable with scoped permissions.

## Phase 2: Current state capture (critical)
Actions:
- Capture in-house guests as open stays.
- Capture future reservations (`source=MANUAL_IMPORT` policy).
- Capture opening balances and deposits.
- Capture real room statuses before first live shift (`DIRTY` or `VACANT_READY`; `OCCUPIED` comes from in-house check-ins).

Templates:
- `docs/operations/templates/day1-inhouse-stays-template.csv`
- `docs/operations/templates/day1-future-reservations-template.csv`
- `docs/operations/templates/day1-room-status-template.csv`
- `docs/operations/templates/day1-opening-balances-template.csv`
- `docs/operations/templates/day1-signoff-template.md`

System evidence:
- `GET /v1/properties/:propertyId/reservations/today-board`
- `GET /v1/properties/:propertyId/invoices`

Gate:
- Front desk board matches live floor reality.
- Finance opening balances are loaded and reviewable.

Automation:
- `pnpm ops:day1:import -- --mode inhouse`
- `pnpm ops:day1:import -- --mode future`
- `pnpm ops:day1:import -- --mode opening-balances`
- `pnpm ops:day1:import -- --mode room-status`
- `pnpm ops:day1:import -- --mode all` (runs in-house -> future -> opening-balances -> room-status)

Notes:
- Opening-balance import posts a marker-based charge (`[DAY1_OPENING_CHARGE]`) and optional marker-based deposit payment (`[DAY1_OPENING_DEPOSIT]`) for idempotent reruns.

Dry run:
- `pnpm ops:day1:import -- --mode all --dry-run`

## Phase 3: Cut-over strategy
Recommended switch time:
- Preferred: immediately after previous day `Daily Close`.
- Alternate: shift-change window with mandatory handover.

Hard rules:
- Old system becomes read-only.
- No parallel dual entry.
- New bookings/payments only in Meshva.

System evidence:
- `GET /v1/properties/:propertyId/daily-close?date=<yesterday>`
- `GET /v1/properties/:propertyId/daily-close?date=<today>`
- Front desk and finance handover submissions.

## Phase 4: First live operations cycle (Day 1)
Role operations:
- Front Desk: assisted booking, check-in/out, shift handover.
- Housekeeping: DIRTY -> CLEANING -> CLEAN -> READY.
- Finance: payment capture, approved refund execution, daily close.
- Manager: approval queues and exception review.
- Owner: read-only KPI/risk visibility.

## Phase 5: Integrity controls
- Daily close is mandatory and day-locking is enforced.
- All mutations audited.
- Exceptions monitored: discounts, refunds, day unlocks, inventory overrides.

## Phase 6: Training-by-workflow
- Train users through real task execution in production flow.
- Avoid classroom-only training handoff.

## Phase 7: First 72 hours stabilization
- Monitor role usage and exception frequency.
- Use a rapid support channel (WhatsApp recommended).
- Fix via auditable corrections, not system rollback.

## Automated readiness check
Use the operational script:

```bash
cp scripts/ops/day1-onboarding.env.example /tmp/day1-onboarding.env
source /tmp/day1-onboarding.env
bash scripts/ops/day1-onboarding-readiness.sh
```

Result semantics:
- `RESULT=BLOCKED` -> do not cut over.
- `RESULT=READY_WITH_N_WARNINGS` -> proceed only after manual gate sign-off.
