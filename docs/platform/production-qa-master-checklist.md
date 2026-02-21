# Production QA Master Checklist (Execution Baseline)

## Role Context
- Assumed Role: Senior QA Engineer (Backend Systems Validation & Production Readiness)

## Release Gate (Hard)
System is release-candidate only when:
- `pnpm smoke:backend-prod` passes
- `pnpm smoke:qa-master` passes
- No `ASSERT_FAIL` in either run

## Automated Command
```bash
pnpm smoke:qa-master
```

## What `smoke:qa-master` validates
1. Full production-readiness chain
- Runs `scripts/smoke/backend-production-readiness.sh` (schema, auth/RBAC, guest workflow, operations E2E, governance, day1 readiness).

2. Observability baseline
- `GET /v1/health` returns `healthy`.
- `GET /v1/ready` returns `healthy`.
- `GET /v1/metrics` contains request and process metrics.
- `x-request-id` is echoed back for traceability.

3. Security and isolation negative tests
- Cross-tenant property access is denied (`403`).
- Guest identity cannot access staff operational route (`403`).
- Missing `x-tenant-id` on property route is rejected (`401`).
- CSRF is enforced on authenticated mutation (`403 AUTH_CSRF_INVALID`).
- Refresh replay using stale refresh cookie is denied (`401 AUTH_REFRESH_INVALID|AUTH_REFRESH_REUSE_DETECTED`).

4. Concurrency stability sanity
- 20 concurrent public search requests return `200` (no non-200 responses).

## Checklist-to-Automation Mapping
Covered directly by automation:
- Authentication/session baseline
- RBAC and tenant isolation
- Reservation/stay/housekeeping/kitchen/finance governance flows
- Idempotency checks in critical flows
- Daily close control
- Observability endpoints and request correlation

Partially covered / manual or dedicated load-test required:
- sustained high-load profiling (`k6`/Artillery recommended)
- deep chaos testing (db/network fault injection)
- backup/restore disaster drills
- long-horizon soak testing

## Operational Note
`day1-onboarding-readiness` may report `WARN` for today's lock status when Daily Close already executed. This does not fail the gate unless `FAIL>0`.
