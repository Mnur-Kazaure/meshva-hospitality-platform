# Front Desk Dashboard Pack #1 - Implementation Notes

## Required Request Headers
- `x-tenant-id`: tenant UUID
- `x-user-id`: actor user UUID
- `x-role`: optional role code
- `x-permissions`: comma-separated permissions
- `Idempotency-Key`: required for idempotent operations

## Front Desk Endpoints

### Guests
- `GET /v1/properties/:propertyId/guests`
- `POST /v1/properties/:propertyId/guests`
- `PATCH /v1/properties/:propertyId/guests/:guestId`

### Availability
- `GET /v1/properties/:propertyId/availability?roomTypeId=...&checkIn=...&checkOut=...`

### Reservations
- `GET /v1/properties/:propertyId/reservations`
- `GET /v1/properties/:propertyId/reservations/today-board`
- `POST /v1/properties/:propertyId/reservations`
- `PATCH /v1/properties/:propertyId/reservations/:reservationId`
- `POST /v1/properties/:propertyId/reservations/:reservationId/cancel`

### Stays
- `POST /v1/properties/:propertyId/stays/checkin`
- `POST /v1/properties/:propertyId/stays/:stayId/change-room`
- `POST /v1/properties/:propertyId/stays/:stayId/extend`
- `POST /v1/properties/:propertyId/stays/:stayId/checkout`

### Rooms
- `GET /v1/properties/:propertyId/rooms/board`

### Confirmations
- `POST /v1/properties/:propertyId/confirmations/send`

### Shift Handover
- `POST /v1/properties/:propertyId/handover`
- `GET /v1/properties/:propertyId/handover/latest`

## Guard Rails Implemented
- Tenant/property scope guard on property routes.
- Permission guard per endpoint.
- Idempotency cache guard for booking/payment-like actions.
- Mutation audit logging with before/after payload capture.
- In-memory inventory checks to prevent double-booking in current scaffold.

## Persistence Mode (New)
- `PERSISTENCE_MODE=memory` (default): in-memory repository (`FrontDeskMemoryRepository`).
- `PERSISTENCE_MODE=postgres`: Postgres repository (`FrontDeskPostgresRepository`) backed by SQL migrations.
- Migration files:
  - `apps/core-api/src/database/migrations/sql/001_front_desk_pack_1.sql`
  - `apps/core-api/src/database/migrations/sql/002_seed_front_desk_demo.sql`
  - `apps/core-api/src/database/migrations/sql/003_seed_front_desk_permissions.sql`

## Seed Context (Local Scaffold)
- `tenant_id`: `11111111-1111-1111-1111-111111111111`
- `property_id`: `22222222-2222-2222-2222-222222222222`
- room types and rooms are pre-seeded in `TenancyStoreService`.
