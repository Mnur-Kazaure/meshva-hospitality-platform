# Auth Controller Contracts v1 (Final, Sealed) - Phase 1 (No MFA)

Assumed Role: Principal Identity & Access Architect

## Sealed decision
- Phase 1 authentication is email/phone + password only.
- No OTP, no MFA, no step-up authentication in active routes.
- MFA schema stubs may exist but must remain unused until a later phase.

## Codex implementation directive
- Do not expose `/mfa` endpoints for staff or guest in Phase 1.
- Do not include MFA fields in login/refresh responses.
- Keep auth model as:
  - Access token in `__Host-meshva_at` (HttpOnly, Secure, `SameSite=Lax`, `Path=/`)
  - Refresh token in `__Host-meshva_rt` (HttpOnly, Secure, `SameSite=Lax`, `Path=/`)
  - CSRF token in `meshva_csrf` (Secure, readable cookie)
- Enforce:
  - CSRF + Origin checks on state-changing authenticated routes
  - Origin checks on refresh endpoints (`/v1/auth/refresh`, `/v1/guest/auth/refresh`)
  - Refresh token rotation with reuse protection
  - Generic login failure response (`AUTH_INVALID_CREDENTIALS`)

## Staff auth routes
- `POST /v1/auth/login`
- `POST /v1/auth/refresh`
- `POST /v1/auth/logout`
- `POST /v1/auth/logout-all`
- `POST /v1/auth/change-password`
- `POST /v1/auth/forgot-password`
- `POST /v1/auth/reset-password`
- `POST /v1/auth/invites/accept`

## Staff management routes (property-scoped)
- `GET /v1/properties/:propertyId/staff`
- `POST /v1/properties/:propertyId/staff`
- `PATCH /v1/properties/:propertyId/staff/:userId`
- `POST /v1/properties/:propertyId/staff/:userId/deactivate`
- `POST /v1/properties/:propertyId/staff/:userId/activate`
- `POST /v1/properties/:propertyId/staff/:userId/reset-invite`
- `POST /v1/properties/:propertyId/staff/:userId/soft-delete`

## Guest auth routes
- `POST /v1/guest/auth/register`
- `POST /v1/guest/auth/login`
- `POST /v1/guest/auth/refresh`
- `POST /v1/guest/auth/logout`
- `POST /v1/guest/auth/change-password`

## Guest access policy
- Public without login:
  - `GET /v1/public/search`
  - `GET /v1/public/properties/:propertyId`
  - `GET /v1/public/properties/:propertyId/availability`
- Login required:
  - `POST /v1/guest/bookings/checkout`
  - `POST /v1/guest/bookings/:reservationId/cancel`
  - `POST /v1/guest/bookings/:reservationId/modify`
  - `PATCH /v1/guest/profile`

## Response contract notes
- Staff login/refresh return:
  - `user`
  - `requiresPasswordChange`
- Guest register/login/refresh return:
  - `guest`

## Out of scope in Phase 1
- Any MFA enrollment/verification endpoint.
- OTP-based authentication.
