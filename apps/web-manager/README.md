# web-manager

Manager Console (Pack #2) web-first implementation.

## Routes
- `/ops-overview`
- `/approvals`
- `/inventory-rates`
- `/reservations-stays`
- `/room-oversight`
- `/staff-activity`
- `/reports`
- `/settings`

## Theme
Uses sealed Meshva brand colors from logo via CSS variables in `src/app/globals.css`.

## FSD Architecture
- `src/app`: route wrappers only
- `src/widgets/`: screen composition + dashboard shell
- `src/features/`: user action hooks/services
- `src/entities/`: domain data and repositories
- `src/shared/`: ui/lib/config/types reusable layer
- `src/processes/`: cross-feature flows

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
