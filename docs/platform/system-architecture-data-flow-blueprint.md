# System Architecture and Data Flow Blueprint
Assumed Role: Chief Software Architect

## Document Control
- Status: Sealed
- Scope: Multi-tenant, multi-property PMS + Booking + Finance + Kitchen
- Stack: NestJS (`apps/core-api`) + PostgreSQL + Redis/BullMQ + Next.js dashboard apps (PWA)
- Monorepo: `meshva-hospitality` (Turborepo)
- Effective date: February 19, 2026

## 1) Architecture Overview
### Monorepo Components
- `apps/core-api`: NestJS API, guards/interceptors, domain services, persistence adapters, queue producers.
- `apps/web-*`: role-based Next.js dashboards.
- `packages/contracts`: shared DTOs, enums, permissions, events.
- `packages/ui`: brand/theme and shared UI components.

### Phase 1 Runtime Topology
- `core-api` HTTP process.
- Worker processors (BullMQ) from the same codebase (can run same container/process initially, split later).
- PostgreSQL as system of record.
- Redis for queue/cache/idempotency support.

### Sealed Runtime Rules
- Domain logic in services, not controllers.
- Every mutation enforces: tenant/property scope + RBAC + audit.
- Sealed mutation routes require `Idempotency-Key`.
- No hard deletes for money/inventory records. Reversal/adjustment only.

## 2) Logical Components
### Client Apps (Next.js)
- `web-platform-admin`: tenant governance.
- `web-owner`: tenant portfolio oversight.
- `web-manager`: approvals, rates, inventory, interventions.
- `web-front-desk`: reservations, assisted booking, check-in/check-out.
- `web-finance`: payments, refunds execution, daily close.
- `web-housekeeping`: readiness workflow and maintenance reporting.
- `web-kitchen`: menu/orders/folio-charge workflow UI.
- `web-guest`: public booking + guest self-service.

### API Layer (NestJS)
- Controllers: thin request layer.
- Global guards/interceptors (wired in `apps/core-api/src/app.module.ts`):
  - `RequestContextGuard`
  - `TenantStatusGuard`
  - `TenantScopeGuard`
  - `PermissionsGuard`
  - `IdempotencyInterceptor`

### Domain Modules (Sealed)
- Implemented modules:
  - `tenancy`, `auth`, `rbac`, `audit`, `users`
  - `properties`, `rooms`, `inventory`
  - `guests`, `reservations`, `stays`
  - `billing`, `housekeeping`, `messaging`
  - `approvals`, `reporting`, `handover`
  - `platform`, `manager`, `guest-portal`
- Planned/next implementation:
  - `kitchen` backend endpoints and services are not yet implemented in `apps/core-api/src/modules/kitchen/kitchen.module.ts`.

### Async Layer (BullMQ)
- Queue processors currently present:
  - `apps/core-api/src/jobs/messaging.processor.ts`
  - `apps/core-api/src/jobs/reporting.processor.ts`
- Sealed queue namespaces:
  - `messaging.send`
  - `reporting.export.generate`
  - `reporting.daily-summary.generate`
  - `exceptions.raise` (implemented through reporting/owner exception flow in Phase 1)

## 3) Standard Mutation Request Lifecycle
1. Authenticate and resolve `user_id` + `tenant_id`.
2. Validate property membership and tenant ownership.
3. Enforce RBAC permission(s).
4. Resolve idempotency key (if required route).
5. Execute service logic in transaction (when mutation spans tables).
6. Persist audit log (`before/after` payload where applicable).
7. Emit in-process event and/or enqueue async work.
8. Persist idempotent response payload for duplicate requests.

## 4) Domain Event Model
### Event Strategy (Phase 1)
- In-process orchestration events with queue dispatch.
- Durable truth remains in PostgreSQL entities + audit logs.
- Optional later: transactional outbox for strict delivery guarantees.

### Event Naming Convention
- Reservation: `ReservationCreated|Updated|Cancelled`
- Stay/Room: `StayOpened|Extended|Closed`, `RoomStatusChanged`
- Finance: `PaymentRecorded`, `RefundApproved`, `RefundExecuted`
- Approvals: `DiscountRequested|Approved|Rejected`, `OverrideRequested|Approved|Rejected`
- Operations: `DailyCloseCompleted`, `DayUnlocked`, `ExceptionRaised`
- Reporting: `ExportRequested`, `ExportReady`
- Kitchen: `KitchenOrderCreated`, `KitchenOrderStatusChanged`, `FolioChargePosted`

## 5) End-to-End Data Flows
### A) Guest Online Booking
1. `GET /v1/public/search` checks availability.
2. `POST /v1/public/bookings` (`Idempotency-Key`):
   - validate property/room type
   - reserve inventory transactionally
   - upsert guest
   - create reservation
   - write audit
   - enqueue confirmation

Outputs:
- `reservations` row, inventory updates, `audit_logs` row, queue message.

### B) Front Desk Assisted Booking
1. `POST /v1/properties/:propertyId/reservations` (`Idempotency-Key`).
2. Same reservation-domain path as guest booking.
3. `POST /v1/properties/:propertyId/confirmations/send` for WhatsApp/SMS placeholders.

### C) Check-In
1. `POST /v1/properties/:propertyId/stays/checkin` (`Idempotency-Key`):
   - validate reservation status
   - assign room safely
   - create `stays` record (OPEN)
   - set room OCCUPIED
   - ensure/open invoice
   - audit + optional messaging

### D) Kitchen Order to Folio Charge (Sealed Target Flow)
1. Create order (`kitchen/orders`).
2. Move state to `DELIVERED` (strict state machine).
3. Post charge (`kitchen/orders/:orderId/post-charge`) with idempotency.
4. Create `folio_line_items` charge linked to order.

Note:
- This flow is sealed architecturally and implemented on frontend/contracts; backend endpoints are pending in Pack #8 backend implementation.

### E) Record Payment
1. `POST /v1/properties/:propertyId/payments` (`Idempotency-Key`):
   - validate invoice/day lock
   - create immutable payment
   - recalculate/cache balance totals
   - audit + receipt placeholder queue

### F) Discount Approval
1. Front Desk creates discount request.
2. Manager approves/rejects request.
3. On approve, billing writes discount line item.
4. Audit for both approval action and billing effect.

### G) Refund Flow
1. Refund request created.
2. Manager approval/rejection.
3. Finance executes approved refund.
4. Immutable ledger/audit trail maintained.

### H) Checkout to Housekeeping
1. `POST /v1/properties/:propertyId/stays/:stayId/checkout`.
2. Close stay, set room `DIRTY`, create housekeeping task.
3. Housekeeping board immediately reflects task.

### I) Daily Close and Locking
1. Finance closes day with expected vs counted totals.
2. Day becomes LOCKED (edit protections active).
3. Reports/exceptions jobs enqueued.
4. Manager unlock (rare) is audited and owner-visible.

## 6) Data Access and Performance Patterns
- Tenant/property scoped filters on all operational queries.
- Core indexes:
  - reservations: `(property_id, status, check_in)`
  - guests: phone lookup
  - inventory: `(tenant_id, property_id, room_type_id, date)`
  - audit: `(tenant_id, entity_type, entity_id, created_at)`
- Inventory contention handling:
  - lock inventory rows by date range and room type
  - return `409 Conflict` on contention/unavailable stock
- Financial truth:
  - line items + payments are authoritative
  - derived totals are synchronized and re-computable

## 7) Security and Isolation Enforcement Points
- Tenancy isolation:
  - request context + guard enforcement
  - DB scoped keys/constraints (Pack A schema hardening)
- RBAC:
  - route-level `@RequirePermissions` and `PermissionsGuard`
- Guest scope:
  - guest identity bound to own reservation space via phone/profile mapping

## 8) Observability Minimum Baseline
- Request ID and context-rich logs (tenant/property/user/route/action).
- Health endpoints:
  - `/health`
  - `/ready`
- Queue visibility:
  - backlog + failures + retry metrics (basic phase baseline).

## 9) Deployment Topology (Phase 1)
- `core-api` (HTTP)
- worker process for queue processors (can co-run initially)
- PostgreSQL
- Redis
- optional reverse proxy (nginx)
- environment profiles: dev/stage/prod

## 10) Governance Checklist (Definition of Done for New Flows)
- Route has tenant/property scope enforcement.
- Route has RBAC permission mapping.
- Mutation has `Idempotency-Key` if required.
- Mutation writes audit logs.
- Financial/inventory effects are immutable-safe.
- Async effects are queued (not synchronous external calls).
- Pack docs and contracts updated in same change set.
