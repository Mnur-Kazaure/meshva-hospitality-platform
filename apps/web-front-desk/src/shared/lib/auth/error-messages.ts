import { ApiClientError, isApiClientError } from './api-error';

const ERROR_CODE_MESSAGE_MAP: Record<string, string> = {
  AUTH_INVALID_CREDENTIALS: 'Invalid credentials. Check your email/phone and password.',
  AUTH_REFRESH_INVALID: 'Session expired. Please login again.',
  AUTH_CSRF_INVALID: 'Security check failed. Refresh page and try again.',
  AUTH_ORIGIN_INVALID: 'Security check failed. Open the dashboard from an approved origin.',
  AUTH_TENANT_SUSPENDED: 'Account suspended. Contact your administrator.',
  AUTH_ACCOUNT_DISABLED: 'Account disabled. Contact your administrator.',
  AUTH_RATE_LIMITED: 'Too many attempts. Please wait and try again.',
};

export function mapAuthErrorMessage(error: unknown, fallback = 'Request failed. Please retry.'): string {
  if (!isApiClientError(error)) {
    return fallback;
  }

  const knownMessage = ERROR_CODE_MESSAGE_MAP[error.code];
  if (knownMessage) {
    return knownMessage;
  }

  if (error.status === 401) {
    return 'Session expired. Please login again.';
  }

  if (error.status === 403) {
    return 'Access denied for this action.';
  }

  if (error.status === 429) {
    return 'Too many attempts. Please wait and try again.';
  }

  return error.message || fallback;
}

export function isSessionExpiredError(error: unknown): boolean {
  if (!isApiClientError(error)) {
    return false;
  }

  return error.status === 401 || error.code === 'AUTH_REFRESH_INVALID';
}

export function asApiClientError(error: unknown): ApiClientError | undefined {
  return isApiClientError(error) ? error : undefined;
}
