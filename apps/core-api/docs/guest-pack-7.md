# Guest Portal Pack #7 - Implementation Notes

## Required Request Headers
- Tenant scope (all routes): `x-tenant-id`
- Public routes (`/v1/public/*`):
  - optional `x-user-id` (auto-derived when absent)
  - optional `x-guest-phone` / `x-guest-email`
- Authenticated guest routes (`/v1/guest/*`):
  - `x-user-id`
  - `x-guest-phone` or `x-guest-email` (ownership scope)
  - `x-permissions` with `GUEST.*` codes
- `Idempotency-Key` for booking create/modify/cancel and profile update

## Guest Pack Endpoints

### Public
- `GET /v1/public/search`
- `GET /v1/public/properties/:propertyId`
- `POST /v1/public/bookings`

### Authenticated Guest
- `GET /v1/guest/bookings`
- `GET /v1/guest/bookings/:reservationId`
- `POST /v1/guest/bookings/:reservationId/modify`
- `POST /v1/guest/bookings/:reservationId/cancel`
- `GET /v1/guest/profile`
- `PATCH /v1/guest/profile`

## Guard Rails Implemented
- Public booking uses the same reservations service and inventory checks as Front Desk.
- Guest booking ownership enforced by phone/email identity headers.
- Modify/cancel blocked within 24h of check-in and for non-mutable statuses.
- Booking create/modify/cancel emits standard reservation events and audit logs.
- Profile updates are audited with guest role context.

## Persistence
- New migration files:
  - `src/database/migrations/sql/019_guest_pack_7.sql`
  - `src/database/migrations/sql/020_seed_guest_permissions.sql`
  - `src/database/migrations/sql/021_seed_guest_demo.sql`

## Seed Context
- Guest demo profile: `62000000-0000-4000-8000-000000000003` (`+2348033333333`)
- Guest demo reservation: `63000000-0000-4000-8000-000000000003` (`source=ONLINE`)

## Smoke Test
- Script: `scripts/smoke/guest-pack7-smoke.sh`
- Coverage:
  - Public search
  - Public booking create + idempotent replay
  - Guest bookings list/detail
  - Guest modify
  - Guest cancel
  - Guest profile read/update
- Assertions:
  - Idempotent create returns same reservation id
  - Modify updates checkout date
  - Cancel returns `CANCELLED`
  - Profile update persists expected guest name
