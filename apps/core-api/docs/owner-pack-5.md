# Dashboard Pack #5 - Owner Console (Multi-property)

## Scope
- Tenant-wide executive visibility across assigned properties.
- Risk center for governance exceptions (acknowledgement + notes).
- Export job pipeline (async placeholder through queue jobs).

## API Endpoints
- `GET /v1/owner/overview`
- `GET /v1/owner/properties`
- `GET /v1/owner/financial-summary`
- `GET /v1/owner/operations-summary`
- `GET /v1/owner/exceptions`
- `POST /v1/owner/exceptions/:exceptionId/ack`
- `POST /v1/owner/exceptions/:exceptionId/note`
- `GET /v1/owner/audit`
- `POST /v1/owner/exports`
- `GET /v1/owner/exports/:exportId`

## Permissions
- `OWNER.PORTFOLIO_VIEW`
- `OWNER.PROPERTY_VIEW`
- `OWNER.FINANCE_VIEW`
- `OWNER.OPERATIONS_VIEW`
- `OWNER.EXCEPTIONS_VIEW`
- `OWNER.AUDIT_VIEW`
- `OWNER.EXPORT`
- `OWNER.ALERTS_CONFIG`
- `OWNER.NOTE_CREATE`

## Owner Exception Triggers
Exceptions are created automatically from audited mutations for:
- Daily close variance
- Day unlock by manager
- Discount applied
- Refund approved
- Refund executed
- Inventory overridden
- Multiple cancels by same actor in short window
- High manual adjustments on same invoice

## Notes
- Owner endpoints are tenant-scoped and enforce user-property access map.
- If explicit property assignments exist for a user, all owner reads/writes are restricted to that set.
- Export jobs are queued (`reporting.export.generate`) and tracked in `owner_export_jobs`.
