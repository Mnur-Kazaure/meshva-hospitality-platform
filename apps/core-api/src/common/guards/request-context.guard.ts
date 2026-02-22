import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GuestPermissions } from '@meshva/contracts';
import { createHash, randomUUID } from 'crypto';
import { AuthIdentityService } from '../../modules/auth/auth-identity.service';
import { AuthTokenService } from '../../modules/auth/auth-token.service';
import { parseCookies } from '../utils/cookies';
import { AppRequest } from '../types/request-context';

@Injectable()
export class RequestContextGuard implements CanActivate {
  constructor(
    private readonly authTokenService: AuthTokenService,
    private readonly authIdentityService: AuthIdentityService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AppRequest>();
    const response = context.switchToHttp().getResponse();
    const path = request.path ?? '';
    const method = request.method.toUpperCase();
    const requestId = this.resolveRequestId(request);
    request.requestId = requestId;
    response?.setHeader?.('x-request-id', requestId);

    if (this.isInfrastructureRoute(path, method)) {
      request.context = {
        tenantId: 'public',
        userId: '00000000-0000-0000-0000-000000000000',
        requestId,
        role: 'System',
        permissions: [],
        identityType: 'header',
      };
      return true;
    }

    const tenantIdHeader = this.readHeader(request.headers['x-tenant-id']);
    const userIdHeader = this.readHeader(request.headers['x-user-id']);
    const guestPhoneHeader = this.readHeader(request.headers['x-guest-phone']);
    const guestEmailHeader = this.readHeader(request.headers['x-guest-email']);
    const roleHeader = this.readHeader(request.headers['x-role']);
    const userAgent = this.readUserAgent(request.headers['user-agent']);

    const cookieHeader = this.readHeader(request.headers.cookie);
    const cookies = parseCookies(cookieHeader);
    const bearerToken = this.parseBearerToken(this.readHeader(request.headers.authorization));
    const accessCookieName = this.authTokenService.cookieNames().access;
    const accessToken = cookies[accessCookieName] ?? bearerToken;

    if (accessToken) {
      const tokenPayload = this.authTokenService.verifyAccessToken(accessToken);
      if (tokenPayload) {
        if (tokenPayload.typ === 'staff') {
          const tenantId = tokenPayload.tid ?? tenantIdHeader;
          if (!tenantId) {
            throw new UnauthorizedException('Tenant context is required for staff access token');
          }

          const user = await this.authIdentityService.getStaffById(tenantId, tokenPayload.sub);
          if (!user) {
            throw new UnauthorizedException('AUTH_INVALID_CREDENTIALS');
          }
          if (user.status !== 'active') {
            throw new ForbiddenException('AUTH_ACCOUNT_DISABLED');
          }

          const roleNames = await this.authIdentityService.listStaffRoleNames(
            tenantId,
            tokenPayload.sub,
          );
          const permissions = await this.authIdentityService.listStaffPermissions(
            tenantId,
            tokenPayload.sub,
          );
          const propertyId =
            typeof request.params?.propertyId === 'string' ? request.params.propertyId : undefined;

          if (
            propertyId &&
            !roleNames.includes('Owner') &&
            !roleNames.includes('PlatformAdmin')
          ) {
            const hasAccess = await this.authIdentityService.hasPropertyAccess(
              tenantId,
              tokenPayload.sub,
              propertyId,
            );
            if (!hasAccess) {
              throw new ForbiddenException('AUTH_PROPERTY_ACCESS_DENIED');
            }
          }

          request.context = {
            tenantId,
            userId: tokenPayload.sub,
            requestId,
            role: roleNames[0],
            permissions,
            propertyId,
            ipAddress: request.ip,
            userAgent,
            identityType: 'staff',
            sessionId: tokenPayload.sid,
          };

          return true;
        }

        if (tokenPayload.typ === 'guest') {
          const isGuestContextRoute =
            path.startsWith('/v1/guest/auth') || path === '/v1/guest/me';
          if (!tenantIdHeader && !isGuestContextRoute) {
            throw new UnauthorizedException('x-tenant-id header is required');
          }

          const guest = await this.authIdentityService.getGuestAuthById(tokenPayload.sub);
          if (!guest) {
            throw new UnauthorizedException('AUTH_INVALID_CREDENTIALS');
          }
          if (guest.status !== 'active') {
            throw new ForbiddenException('AUTH_ACCOUNT_DISABLED');
          }

          request.context = {
            tenantId: tenantIdHeader ?? 'public',
            userId: tokenPayload.sub,
            requestId,
            role: 'Guest',
            permissions: Object.values(GuestPermissions),
            propertyId:
              typeof request.params?.propertyId === 'string' ? request.params.propertyId : undefined,
            ipAddress: request.ip,
            userAgent,
            identityType: 'guest',
            sessionId: tokenPayload.sid,
            guestEmail: guest.emailNormalized,
            guestPhone: guest.phoneE164,
          };

          return true;
        }
      }
    }

    const isPublicRoute = path.startsWith('/v1/public');
    const isOpenAuthRoute = this.isOpenAuthRoute(path, method);
    const requiresTenantHeader = !path.startsWith('/v1/guest/auth') && !isOpenAuthRoute;

    if (requiresTenantHeader && !tenantIdHeader) {
      throw new UnauthorizedException('x-tenant-id header is required');
    }

    if ((!userIdHeader || !this.isUuidLike(userIdHeader)) && !isPublicRoute && !isOpenAuthRoute) {
      throw new UnauthorizedException('x-user-id header is required');
    }

    const headerPermissions = this.readPermissions(this.readHeader(request.headers['x-permissions']));
    request.context = {
      tenantId: tenantIdHeader ?? 'public',
      userId:
        typeof userIdHeader === 'string' && this.isUuidLike(userIdHeader)
          ? userIdHeader
          : this.derivePublicGuestUserId(guestPhoneHeader),
      requestId,
      role:
        typeof roleHeader === 'string'
          ? roleHeader
          : isPublicRoute
            ? 'Guest'
            : undefined,
      permissions: headerPermissions,
      propertyId:
        typeof request.params?.propertyId === 'string' ? request.params.propertyId : undefined,
      ipAddress: request.ip,
      userAgent,
      identityType: 'header',
      guestEmail: guestEmailHeader ? guestEmailHeader.toLowerCase() : undefined,
      guestPhone: this.normalizePhone(guestPhoneHeader),
    };

    return true;
  }

  private isInfrastructureRoute(path: string, method: string): boolean {
    if (method !== 'GET') {
      return false;
    }

    const normalizedPath = path.toLowerCase();
    return (
      normalizedPath === '/v1/health' ||
      normalizedPath === '/v1/ready' ||
      normalizedPath === '/v1/metrics'
    );
  }

  private isOpenAuthRoute(path: string, method: string): boolean {
    const normalizedPath = path.toLowerCase();
    if (method === 'GET') {
      return false;
    }

    return (
      normalizedPath === '/v1/auth/login' ||
      normalizedPath === '/v1/auth/refresh' ||
      normalizedPath === '/v1/auth/invites/accept' ||
      normalizedPath === '/v1/auth/forgot-password' ||
      normalizedPath === '/v1/auth/reset-password' ||
      normalizedPath === '/v1/guest/auth/register' ||
      normalizedPath === '/v1/guest/auth/login' ||
      normalizedPath === '/v1/guest/auth/refresh'
    );
  }

  private parseBearerToken(value: string | undefined): string | undefined {
    if (!value) {
      return undefined;
    }

    if (!value.toLowerCase().startsWith('bearer ')) {
      return undefined;
    }

    return value.slice(7).trim();
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

  private readUserAgent(value: string | string[] | undefined): string | undefined {
    if (typeof value === 'string') {
      return value;
    }

    if (Array.isArray(value)) {
      return value.join(', ');
    }

    return undefined;
  }

  private readPermissions(value: string | undefined): string[] {
    if (!value) {
      return [];
    }

    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private resolveRequestId(request: AppRequest): string {
    const headerValue = this.readHeader(request.headers['x-request-id']);
    if (typeof headerValue === 'string') {
      const normalized = headerValue.trim();
      if (normalized.length > 0 && normalized.length <= 128) {
        return normalized;
      }
    }

    if (typeof request.requestId === 'string' && request.requestId.trim().length > 0) {
      return request.requestId;
    }

    return randomUUID();
  }

  private derivePublicGuestUserId(guestPhone: string | undefined): string {
    if (typeof guestPhone === 'string' && guestPhone.trim().length > 0) {
      const digest = createHash('md5').update(guestPhone.trim()).digest('hex');
      return `${digest.slice(0, 8)}-${digest.slice(8, 12)}-${digest.slice(12, 16)}-${digest.slice(16, 20)}-${digest.slice(20, 32)}`;
    }

    return '00000000-0000-0000-0000-000000000000';
  }

  private normalizePhone(phone: string | undefined): string | undefined {
    if (!phone) {
      return undefined;
    }

    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length > 0 ? digitsOnly : undefined;
  }

  private isUuidLike(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    );
  }
}
