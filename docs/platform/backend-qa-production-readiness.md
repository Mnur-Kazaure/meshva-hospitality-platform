# Backend QA Production Readiness Playbook

## Role Contexts
- `Context: API functional and workflow validation` -> `Assumed Role: Senior QA Engineer (Backend Systems Validation)`
- `Context: Test data and migration consistency` -> `Assumed Role: Database Reliability Engineer`
- `Context: Smoke execution in CI/local` -> `Assumed Role: DevOps QA Automation Engineer`

## Scope
This playbook operationalizes the production-readiness checklist into executable smoke suites for:
- Auth + RBAC security checks
- End-to-end hotel operational flows
- Manager/Owner/Platform governance controls
- Day 1 onboarding readiness
- Schema authority/integrity checks

## Command Matrix
1. Schema authority + immutable/trigger checks
- Command: `pnpm smoke:pack-a`
- Script: `scripts/smoke/pack-a-schema-smoke.sh`
- Covers: core schema existence, immutable delete guard, invoice total sync trigger behavior

2. Auth + RBAC + idempotency enforcement checks
- Command: `pnpm smoke:auth`
- Script: `scripts/smoke/auth-rbac-smoke.sh`
- Covers: staff/guest login-refresh-me-logout, invalid credential handling, permission denial, missing idempotency header rejection

3. Guest workflow smoke
- Command: `pnpm smoke:guest-pack7`
- Scripts:
  - `scripts/smoke/seed-pack7-inventory.sh`
  - `scripts/smoke/guest-pack7-smoke.sh`
- Covers: public search, guest checkout, idempotent create, modify, cancel, profile update

4. Hotel operations E2E workflow smoke
- Command: `pnpm smoke:ops-e2e`
- Script: `scripts/smoke/operations-e2e-smoke.sh`
- Covers:
  - Front Desk reservation -> check-in -> checkout
  - Housekeeping task state machine (`DIRTY -> CLEANING -> CLEAN -> READY`)
  - Kitchen order state machine + post charge to folio
  - Finance payment + daily close lock rejection behavior

5. Governance and oversight smoke
- Command: `pnpm smoke:governance`
- Script: `scripts/smoke/governance-smoke.sh`
- Covers:
  - Manager approvals (discount/refund/override)
  - Owner reporting, exceptions, notes, exports
  - Platform admin health, tenants, flags, plans, impersonation, support password reset

6. Day 1 onboarding readiness gate
- Command: `pnpm ops:day1:check`
- Script: `scripts/ops/day1-onboarding-readiness.sh`
- Covers: pre-deployment tenant readiness, role access checks, operational cut-over signals

7. Unified backend readiness run
- Command: `pnpm smoke:backend-prod`
- Script: `scripts/smoke/backend-production-readiness.sh`
- Runs all suites in sequence.

8. Master hardening gate (negative-path + observability + stability sanity)
- Command: `pnpm smoke:qa-master`
- Script: `scripts/smoke/qa-master-gate.sh`
- Covers:
  - Full `backend-prod` sequence
  - `/health`, `/ready`, `/metrics`, request-id echo
  - Cross-tenant and guest/staff isolation negative checks
  - CSRF enforcement on authenticated mutation
  - Refresh replay denial path
  - 20-request concurrent search sanity

## Required Local Preconditions
- Core API running on `http://127.0.0.1:8081/v1`
- PostgreSQL populated with migrations and demo seeds through current pack
- Redis available for queue-backed actions
- Tools installed: `curl`, `jq`, `psql`

## Certification Gate (Pass Criteria)
Backend is considered QA-smoke ready when:
- `pnpm smoke:backend-prod` exits with code `0`
- No `ASSERT_FAIL` appears in output
- End marker prints: `RESULT=BACKEND_PRODUCTION_READINESS_PASS`

## Known Boundaries
- These are production-grade smoke suites, not full load/perf testing.
- Concurrency/load and chaos/fault injection should be added as separate suites (`k6`/`Artillery` + fault simulation) before go-live.
