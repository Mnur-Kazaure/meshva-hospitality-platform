# web-kitchen

Kitchen & Restaurant Dashboard (Pack #8) web-first implementation.

## Routes
- `/orders`
- `/new-order`
- `/menu-management`
- `/order-history`
- `/reports`
- `/settings`

## FSD Structure
- `src/app`: routing only
- `src/processes`: cross-feature room-service workflow
- `src/widgets`: page-level composites
- `src/features`: user actions (status transition, charge posting, create/cancel order)
- `src/entities`: order/menu/report repositories and models
- `src/shared`: ui primitives, API client, hooks, config, contracts re-exports

## Notes
- All mutation paths route through entity APIs and include idempotency headers.
- UI follows sealed Kitchen Pack #8 flow and integrates with contracts-first DTO types.

## Auth Integration Standard (Phase 1)
- Cookie auth only: `__Host-meshva_at`, `__Host-meshva_rt`, `meshva_csrf`
- Shared API wrapper in `src/shared/lib/auth/client.ts`:
  - `credentials: 'include'`
  - CSRF header on `POST/PATCH/PUT/DELETE`
  - single refresh attempt on `401` via `POST /v1/auth/refresh`
  - one retry of original request after refresh
  - `refreshInFlight` singleton to avoid loops
- Session hydration: `GET /v1/auth/me`
- Protected layout: `StaffAuthGate` in `src/processes/auth/ui/staff-auth-gate.tsx`
- Permission-aware route gating + redirect to `/access-denied`
- Property context switcher: `src/shared/ui/property-switcher.tsx`
- Critical action confirmation dialog component: `src/shared/ui/critical-action-dialog.tsx`

### Auth Routes
- `/login`
- `/accept-invite`
- `/change-password`
- `/forgot-password`
- `/reset-password`
- `/account-disabled`
- `/session-expired`
- `/access-denied`
