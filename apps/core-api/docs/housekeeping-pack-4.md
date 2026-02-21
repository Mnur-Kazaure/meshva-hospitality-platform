# Housekeeping Dashboard Pack #4 - Implementation Notes

## Scope
- Housekeeping task progression flow: `DIRTY -> CLEANING -> CLEAN -> READY`
- Maintenance ticket creation and listing
- Manager assignment for housekeeping tasks
- Room status transitions integrated with Front Desk availability

## Endpoints
- `GET /v1/properties/:propertyId/housekeeping/tasks`
- `GET /v1/properties/:propertyId/housekeeping/rooms/status-board`
- `POST /v1/properties/:propertyId/housekeeping/tasks/:taskId/start`
- `POST /v1/properties/:propertyId/housekeeping/tasks/:taskId/mark-clean`
- `POST /v1/properties/:propertyId/housekeeping/tasks/:taskId/mark-ready`
- `POST /v1/properties/:propertyId/housekeeping/tasks/:taskId/assign`
- `POST /v1/properties/:propertyId/maintenance`
- `GET /v1/properties/:propertyId/maintenance`

## Discipline Guarantees
- All mutation routes are idempotent (`Idempotency-Key` required).
- Every task/room/maintenance mutation writes audit logs.
- Task updates use optimistic lock checks on `updated_at`.
- High-severity maintenance emits manager alert queue event.

## Persistence
- New migration files:
  - `src/database/migrations/sql/010_housekeeping_pack_4.sql`
  - `src/database/migrations/sql/011_seed_housekeeping_permissions.sql`
  - `src/database/migrations/sql/012_seed_housekeeping_demo.sql`

## Seed Context
- Housekeeping user: `70000000-0000-4000-8000-000000000004`
- Demo maintenance ticket: `6b000000-0000-4000-8000-000000000001`
