import { appEnv } from '../../config/env';
import { ApiClientError, toApiClientError } from './api-error';
import { readCookieValue } from './cookies';
import {
  AUTH_COOKIE_CSRF,
  AUTH_HEADER_CSRF,
  AUTH_HEADER_IDEMPOTENCY,
  MUTATION_METHODS,
} from './constants';
import { buildIdempotencyKey } from './idempotency';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  body?: unknown;
  headers?: Record<string, string>;
  requireCsrf?: boolean;
  retryOnUnauthorized?: boolean;
  idempotencyKey?: string;
  idempotencyPrefix?: string;
}

let refreshInFlight: Promise<boolean> | null = null;

function normalizedBaseUrl(): string {
  const baseUrl = appEnv.apiBaseUrl?.trim();
  if (!baseUrl) {
    throw new ApiClientError(
      500,
      'AUTH_CONFIG_INVALID',
      'NEXT_PUBLIC_API_BASE_URL is required to call the API.',
    );
  }

  return baseUrl.replace(/\/$/, '');
}

function toUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBaseUrl()}${normalizedPath}`;
}

function buildBaseHeaders(includeJsonContentType: boolean): Headers {
  const headers = new Headers();
  headers.set('Accept', 'application/json');

  if (includeJsonContentType) {
    headers.set('Content-Type', 'application/json');
  }

  if (appEnv.tenantId) {
    headers.set('x-tenant-id', appEnv.tenantId);
  }

  return headers;
}

async function runRefresh(): Promise<boolean> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = fetch(toUrl('/auth/refresh'), {
    method: 'POST',
    credentials: 'include',
    headers: buildBaseHeaders(false),
  })
    .then((response) => response.ok)
    .catch(() => false)
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
}

async function ensureMutationCsrfToken(requireCsrf: boolean): Promise<string | undefined> {
  if (!requireCsrf) {
    return undefined;
  }

  let csrfToken = readCookieValue(AUTH_COOKIE_CSRF);
  if (csrfToken) {
    return csrfToken;
  }

  const refreshed = await runRefresh();
  if (!refreshed) {
    throw new ApiClientError(401, 'AUTH_REFRESH_INVALID', 'Session expired. Please login again.');
  }

  csrfToken = readCookieValue(AUTH_COOKIE_CSRF);
  if (!csrfToken) {
    throw new ApiClientError(403, 'AUTH_CSRF_INVALID', 'Security check failed. Refresh page.');
  }

  return csrfToken;
}

async function executeRequest<T>(
  method: HttpMethod,
  path: string,
  options: RequestOptions,
  hasRetriedUnauthorized: boolean,
): Promise<T> {
  const isMutation = MUTATION_METHODS.has(method);
  const requireCsrf = options.requireCsrf ?? isMutation;
  const csrfToken = isMutation ? await ensureMutationCsrfToken(requireCsrf) : undefined;

  const headers = buildBaseHeaders(options.body !== undefined);
  if (csrfToken) {
    headers.set(AUTH_HEADER_CSRF, csrfToken);
  }

  const idempotencyKey = options.idempotencyKey
    ? options.idempotencyKey
    : options.idempotencyPrefix
      ? buildIdempotencyKey(options.idempotencyPrefix)
      : undefined;
  if (idempotencyKey) {
    headers.set(AUTH_HEADER_IDEMPOTENCY, idempotencyKey);
  }

  for (const [key, value] of Object.entries(options.headers ?? {})) {
    headers.set(key, value);
  }

  const response = await fetch(toUrl(path), {
    method,
    credentials: 'include',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const shouldRetryUnauthorized =
    response.status === 401 &&
    options.retryOnUnauthorized !== false &&
    !hasRetriedUnauthorized &&
    path !== '/auth/refresh';

  if (shouldRetryUnauthorized) {
    const refreshed = await runRefresh();
    if (refreshed) {
      return executeRequest<T>(method, path, options, true);
    }
  }

  if (!response.ok) {
    throw await toApiClientError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const rawBody = await response.text();
  if (!rawBody) {
    return undefined as T;
  }

  try {
    return JSON.parse(rawBody) as T;
  } catch {
    return undefined as T;
  }
}

function request<T>(method: HttpMethod, path: string, options: RequestOptions = {}) {
  return executeRequest<T>(method, path, options, false);
}

export function apiGet<T>(path: string, options: Omit<RequestOptions, 'body'> = {}): Promise<T> {
  return request<T>('GET', path, { ...options, requireCsrf: false });
}

export function apiPost<T>(path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
  return request<T>('POST', path, { ...options, body });
}

export function apiPut<T>(path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
  return request<T>('PUT', path, { ...options, body });
}

export function apiPatch<T>(path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
  return request<T>('PATCH', path, { ...options, body });
}

export function apiDelete<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return request<T>('DELETE', path, options);
}

export const apiClient = {
  get: apiGet,
  post<T>(path: string, body?: unknown, idempotencyPrefix?: string) {
    return apiPost<T>(path, body, { idempotencyPrefix });
  },
  patch<T>(path: string, body?: unknown, idempotencyPrefix?: string) {
    return apiPatch<T>(path, body, { idempotencyPrefix });
  },
  delete<T>(path: string, idempotencyPrefix?: string) {
    return apiDelete<T>(path, { idempotencyPrefix });
  },
};
