# Cashier & Finance Dashboard Pack #3 - Implementation Notes

## Required Request Headers
- `x-tenant-id`
- `x-user-id`
- `x-role` (optional)
- `x-permissions`
- `Idempotency-Key` for all mutation routes

## Finance Pack Endpoints

### Overview + Invoice/Folio
- `GET /v1/properties/:propertyId/finance/overview`
- `GET /v1/properties/:propertyId/invoices`
- `GET /v1/properties/:propertyId/invoices/:invoiceId`
- `POST /v1/properties/:propertyId/invoices/:invoiceId/adjustments`

### Payments + Refund Execution
- `GET /v1/properties/:propertyId/payments`
- `POST /v1/properties/:propertyId/payments`
- `GET /v1/properties/:propertyId/refunds`
- `POST /v1/properties/:propertyId/refunds/:refundId/execute`

### Daily Close + Shift Handover
- `GET /v1/properties/:propertyId/daily-close`
- `POST /v1/properties/:propertyId/daily-close`
- `POST /v1/properties/:propertyId/finance-handover`

## Guard Rails Implemented
- Tenant/property scope guard on all property routes.
- Finance permission checks on route handlers.
- Idempotency enforced for all finance mutation routes.
- Every finance mutation emits an audit log record.
- Daily close writes day lock (`day_controls`) and blocks same-date financial edits.
- Refund execution requires approved refund request and remains immutable.
- Finance shift handover requires current-day lock to enforce close discipline.

## Persistence
- New migration files:
  - `src/database/migrations/sql/007_finance_pack_3.sql`
  - `src/database/migrations/sql/008_seed_finance_permissions.sql`
  - `src/database/migrations/sql/009_seed_finance_demo.sql`

## Seed Context
- Finance user: `70000000-0000-4000-8000-000000000003`
- Demo invoice: `67000000-0000-4000-8000-000000000001`
- Approved refund request: `66000000-0000-4000-8000-000000000002`
