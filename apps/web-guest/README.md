# web-guest

Guest Portal (Pack #7) web-first implementation.

## Public Routes
- `/home`
- `/property-listing`
- `/property-details`
- `/availability-room-selection`
- `/booking-success`

## Authenticated Guest Routes
- `/booking-confirmation`
- `/my-bookings`
- `/booking-details`
- `/modify-booking`
- `/cancel-booking`
- `/profile`

## Notes
- Booking flow follows "Reserve now, pay at hotel" policy.
- Visual system aligned to Meshva official logo colors.

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
  - single refresh attempt on `401` via `POST /v1/guest/auth/refresh`
  - one retry of original request after refresh
  - `refreshInFlight` singleton to avoid loops
- Session hydration: `GET /v1/guest/me`
- Protected layout: `GuestAuthGate` in `src/processes/auth/ui/guest-auth-gate.tsx`
- Permission-aware navigation uses `permissions[]` from session response

### Guest Auth Routes
- `/login`
- `/guest/login`
- `/guest/register`
- `/change-password`
- `/forgot-password`
- `/reset-password`
- `/account-disabled`
- `/session-expired`
- `/access-denied`
