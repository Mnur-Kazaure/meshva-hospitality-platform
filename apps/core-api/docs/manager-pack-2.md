# Manager Console Dashboard Pack #2 - Implementation Notes

## Required Request Headers
- `x-tenant-id`
- `x-user-id`
- `x-role` (optional)
- `x-permissions`
- `Idempotency-Key` for all mutation routes

## Manager Pack Endpoints

### Ops / Oversight
- `GET /v1/properties/:propertyId/manager/overview`
- `GET /v1/properties/:propertyId/manager/room-oversight`

### Approvals
- `GET /v1/properties/:propertyId/approvals`
- `POST /v1/properties/:propertyId/approvals/discount-requests`
- `POST /v1/properties/:propertyId/approvals/discount-requests/:requestId/approve`
- `POST /v1/properties/:propertyId/approvals/discount-requests/:requestId/reject`
- `POST /v1/properties/:propertyId/approvals/refund-requests`
- `POST /v1/properties/:propertyId/approvals/refund-requests/:requestId/approve`
- `POST /v1/properties/:propertyId/approvals/refund-requests/:requestId/reject`
- `POST /v1/properties/:propertyId/approvals/override-requests`
- `POST /v1/properties/:propertyId/approvals/override-requests/:requestId/approve`
- `POST /v1/properties/:propertyId/approvals/override-requests/:requestId/reject`

### Rates + Inventory
- `GET /v1/properties/:propertyId/rate-plans`
- `POST /v1/properties/:propertyId/rate-plans`
- `PATCH /v1/properties/:propertyId/rate-plans/:ratePlanId`
- `GET /v1/properties/:propertyId/inventory/calendar`
- `POST /v1/properties/:propertyId/inventory/blocks`
- `POST /v1/properties/:propertyId/inventory/overrides`

### Reservation Overrides + Day Control
- `POST /v1/properties/:propertyId/reservations/:reservationId/confirm`
- `POST /v1/properties/:propertyId/reservations/:reservationId/no-show`
- `POST /v1/properties/:propertyId/reservations/:reservationId/force-cancel`
- `POST /v1/properties/:propertyId/day/unlock`

### Staff Activity
- `GET /v1/properties/:propertyId/audit`

## Guard Rails Implemented
- Tenant/property scope guard on all property routes.
- Manager/Front Desk permission checks on route handlers.
- Idempotency enforced for approval and override mutations.
- Every mutation emits audit log records with before/after payloads.
- Manager approval paths enqueue notification jobs for async delivery.

## Persistence
- New migration files:
  - `src/database/migrations/sql/004_manager_pack_2.sql`
  - `src/database/migrations/sql/005_seed_manager_permissions.sql`
  - `src/database/migrations/sql/006_seed_manager_demo.sql`

## Seed Context
- Manager user: `70000000-0000-4000-8000-000000000002`
- Pending discount request: `64000000-0000-4000-8000-000000000001`
- Pending override request: `65000000-0000-4000-8000-000000000001`
