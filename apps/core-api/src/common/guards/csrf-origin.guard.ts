import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import {
  AUTH_COOKIE_ACCESS,
  AUTH_COOKIE_CSRF,
  AUTH_COOKIE_REFRESH,
  AUTH_CSRF_INVALID,
  AUTH_ORIGIN_INVALID,
} from '../../modules/auth/auth.constants';
import { AppRequest } from '../types/request-context';
import { parseCookies } from '../utils/cookies';

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const AUTH_CSRF_EXEMPT_PATHS = new Set([
  '/v1/auth/login',
  '/v1/auth/refresh',
  '/v1/auth/forgot-password',
  '/v1/auth/reset-password',
  '/v1/auth/invites/accept',
  '/v1/guest/auth/register',
  '/v1/guest/auth/login',
  '/v1/guest/auth/refresh',
]);

const AUTH_REFRESH_PATHS = new Set([
  '/v1/auth/refresh',
  '/v1/guest/auth/refresh',
]);

@Injectable()
export class CsrfOriginGuard implements CanActivate {
  private readonly allowedOrigins: Set<string>;

  constructor() {
    this.allowedOrigins = this.parseAllowedOrigins(process.env.AUTH_ALLOWED_ORIGINS);
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AppRequest>();
    const method = request.method.toUpperCase();
    if (!MUTATION_METHODS.has(method)) {
      return true;
    }

    const path = (request.path ?? '').toLowerCase();
    const isCsrfExemptPath = AUTH_CSRF_EXEMPT_PATHS.has(path);
    const isRefreshPath = AUTH_REFRESH_PATHS.has(path);

    if (request.context?.identityType === 'header') {
      return true;
    }

    const cookieHeader = this.readHeader(request.headers.cookie);
    const cookies = parseCookies(cookieHeader);
    const hasAuthCookie = Boolean(cookies[AUTH_COOKIE_ACCESS] || cookies[AUTH_COOKIE_REFRESH]);
    const hasAuthenticatedIdentity =
      request.context?.identityType === 'staff' || request.context?.identityType === 'guest';

    if (!hasAuthCookie && !hasAuthenticatedIdentity && !isRefreshPath) {
      return true;
    }

    const origin = this.readHeader(request.headers.origin);
    if (!origin || !this.allowedOrigins.has(origin)) {
      throw new ForbiddenException(AUTH_ORIGIN_INVALID);
    }

    if (isCsrfExemptPath) {
      return true;
    }

    const csrfCookie = cookies[AUTH_COOKIE_CSRF];
    const csrfHeader = this.readHeader(request.headers['x-csrf-token']);
    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
      throw new ForbiddenException(AUTH_CSRF_INVALID);
    }

    return true;
  }

  private parseAllowedOrigins(raw: string | undefined): Set<string> {
    if (!raw || raw.trim().length === 0) {
      return new Set([
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3001',
      ]);
    }

    return new Set(
      raw
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    );
  }

  private readHeader(value: string | string[] | undefined): string | undefined {
    if (typeof value === 'string') {
      return value;
    }

    if (Array.isArray(value) && value.length > 0) {
      return value[0];
    }

    return undefined;
  }
}
