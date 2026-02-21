export const AUTH_COOKIE_ACCESS = '__Host-meshva_at';
export const AUTH_COOKIE_REFRESH = '__Host-meshva_rt';
export const AUTH_COOKIE_CSRF = 'meshva_csrf';

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;
export const CSRF_TTL_SECONDS = 24 * 60 * 60;

export const STAFF_LOCKOUT_ATTEMPTS = 8;
export const STAFF_LOCKOUT_MINUTES = 15;

export const AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS';
export const AUTH_REFRESH_INVALID = 'AUTH_REFRESH_INVALID';
export const AUTH_CSRF_INVALID = 'AUTH_CSRF_INVALID';
export const AUTH_ORIGIN_INVALID = 'AUTH_ORIGIN_INVALID';
