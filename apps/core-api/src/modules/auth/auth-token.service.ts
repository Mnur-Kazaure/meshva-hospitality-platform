import { Injectable } from '@nestjs/common';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import {
  ACCESS_TOKEN_TTL_SECONDS,
  AUTH_COOKIE_ACCESS,
  AUTH_COOKIE_CSRF,
  AUTH_COOKIE_REFRESH,
  CSRF_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
} from './auth.constants';

export type TokenIdentityType = 'staff' | 'guest';

export interface AccessTokenPayload {
  sub: string;
  typ: TokenIdentityType;
  tid?: string;
  sid: string;
  jti: string;
  iat: number;
  exp: number;
}

interface JwtHeader {
  alg: 'HS256';
  typ: 'JWT';
}

@Injectable()
export class AuthTokenService {
  private readonly jwtSecret: string;

  constructor() {
    this.jwtSecret = process.env.AUTH_JWT_SECRET ?? 'meshva-dev-auth-secret-change-me';
  }

  createAccessToken(input: {
    subjectId: string;
    identityType: TokenIdentityType;
    tenantId?: string;
    sessionId: string;
  }): { token: string; payload: AccessTokenPayload } {
    const now = Math.floor(Date.now() / 1000);
    const payload: AccessTokenPayload = {
      sub: input.subjectId,
      typ: input.identityType,
      tid: input.tenantId,
      sid: input.sessionId,
      jti: randomBytes(16).toString('hex'),
      iat: now,
      exp: now + ACCESS_TOKEN_TTL_SECONDS,
    };

    return {
      token: this.sign(payload),
      payload,
    };
  }

  verifyAccessToken(token: string): AccessTokenPayload | null {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = this.base64UrlEncode(
      createHmac('sha256', this.jwtSecret).update(signingInput).digest(),
    );

    const expectedBytes = Buffer.from(expectedSignature);
    const actualBytes = Buffer.from(encodedSignature);
    if (expectedBytes.length !== actualBytes.length) {
      return null;
    }

    if (!timingSafeEqual(expectedBytes, actualBytes)) {
      return null;
    }

    try {
      const header = JSON.parse(this.base64UrlDecodeToString(encodedHeader)) as JwtHeader;
      if (header.alg !== 'HS256' || header.typ !== 'JWT') {
        return null;
      }

      const payload = JSON.parse(this.base64UrlDecodeToString(encodedPayload)) as AccessTokenPayload;
      const now = Math.floor(Date.now() / 1000);
      if (!payload.exp || payload.exp <= now) {
        return null;
      }

      if (!payload.sub || !payload.sid || !payload.typ) {
        return null;
      }

      if (payload.typ !== 'staff' && payload.typ !== 'guest') {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }

  generateRefreshToken(): string {
    return randomBytes(48).toString('base64url');
  }

  generateCsrfToken(): string {
    return randomBytes(24).toString('base64url');
  }

  getCookieOptions() {
    const secure = true;

    return {
      access: {
        httpOnly: true,
        secure,
        sameSite: 'lax' as const,
        path: '/',
        maxAge: ACCESS_TOKEN_TTL_SECONDS * 1000,
      },
      refresh: {
        httpOnly: true,
        secure,
        sameSite: 'lax' as const,
        path: '/',
        maxAge: REFRESH_TOKEN_TTL_SECONDS * 1000,
      },
      csrf: {
        httpOnly: false,
        secure,
        sameSite: 'lax' as const,
        path: '/',
        maxAge: CSRF_TTL_SECONDS * 1000,
      },
    };
  }

  cookieNames() {
    return {
      access: AUTH_COOKIE_ACCESS,
      refresh: AUTH_COOKIE_REFRESH,
      csrf: AUTH_COOKIE_CSRF,
    };
  }

  private sign(payload: AccessTokenPayload): string {
    const header: JwtHeader = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const signature = createHmac('sha256', this.jwtSecret).update(signingInput).digest();

    return `${signingInput}.${this.base64UrlEncode(signature)}`;
  }

  private base64UrlEncode(value: string | Buffer): string {
    const input = typeof value === 'string' ? Buffer.from(value, 'utf8') : value;
    return input
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  private base64UrlDecodeToString(value: string): string {
    let base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) {
      base64 += '=';
    }

    return Buffer.from(base64, 'base64').toString('utf8');
  }
}
