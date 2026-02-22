import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthEvents, GuestPermissions } from '@meshva/contracts';
import { randomUUID } from 'crypto';
import { Response } from 'express';
import { parseCookies } from '../../common/utils/cookies';
import { AppRequest } from '../../common/types/request-context';
import { PostgresService } from '../persistence/db/postgres.service';
import { AcceptStaffInviteDto } from './dto/accept-staff-invite.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { DeactivateStaffDto } from './dto/deactivate-staff.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { GuestLoginDto } from './dto/guest-login.dto';
import { GuestRegisterDto } from './dto/guest-register.dto';
import { ListStaffDto } from './dto/list-staff.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SoftDeleteStaffDto } from './dto/soft-delete-staff.dto';
import { StaffLoginDto } from './dto/staff-login.dto';
import { StaffResetPasswordDto } from './dto/staff-reset-password.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { AuthIdentityService, GuestAuthRecord, StaffIdentityRecord } from './auth-identity.service';
import {
  AUTH_INVALID_CREDENTIALS,
  AUTH_REFRESH_INVALID,
  STAFF_LOCKOUT_ATTEMPTS,
  STAFF_LOCKOUT_MINUTES,
} from './auth.constants';
import { AuthPasswordService } from './auth-password.service';
import { AuthTokenService } from './auth-token.service';

interface RefreshSessionRecord {
  id: string;
  identityType: 'STAFF' | 'GUEST';
  tenantId?: string;
  userId?: string;
  guestAuthId?: string;
  tokenFamilyId: string;
  expiresAt: string;
  revokedAt?: string;
  replacedBySessionId?: string;
}

interface InviteRecord {
  id: string;
  tenantId: string;
  userId: string;
  expiresAt: string;
  acceptedAt?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly postgres: PostgresService,
    private readonly authTokenService: AuthTokenService,
    private readonly authPasswordService: AuthPasswordService,
    private readonly authIdentityService: AuthIdentityService,
  ) {}

  async loginStaff(request: AppRequest, response: Response, dto: StaffLoginDto) {
    const tenantId = request.context.tenantId;
    const { normalizedEmail, normalizedPhone } = this.normalizeIdentifier(dto.identifier);
    const user = await this.authIdentityService.getStaffByIdentifier(
      tenantId,
      dto.identifier,
      normalizedEmail,
      normalizedPhone,
    );

    const credentialsValid =
      user != null &&
      user.status === 'active' &&
      !this.isLocked(user) &&
      this.authPasswordService.verifyPassword(dto.password, user.passwordHash);

    if (!credentialsValid || !user) {
      if (user) {
        await this.recordFailedStaffLogin(user.id, tenantId);
      }
      await this.insertAuditLog({
        tenantId,
        actorUserId: user?.id,
        actorRole: 'Auth',
        action: AuthEvents.USER_LOGIN_FAILED,
        entityType: 'AuthSession',
        entityId: user?.id ?? randomUUID(),
        afterJson: {
          identifier: this.maskIdentifier(dto.identifier),
        },
        ipAddress: request.ip,
        userAgent: this.readUserAgent(request),
      });
      throw new UnauthorizedException(AUTH_INVALID_CREDENTIALS);
    }

    await this.postgres.query(
      `UPDATE users
       SET failed_login_attempts = 0,
           locked_until = NULL,
           last_login_at = NOW(),
           updated_at = NOW()
       WHERE tenant_id = $1
         AND id = $2`,
      [tenantId, user.id],
    );

    const session = await this.createRefreshSession({
      identityType: 'STAFF',
      tenantId,
      userId: user.id,
      tokenFamilyId: randomUUID(),
      ip: request.ip,
      userAgent: this.readUserAgent(request),
    });

    this.setAuthCookies(
      response,
      this.authTokenService.createAccessToken({
        subjectId: user.id,
        tenantId,
        identityType: 'staff',
        sessionId: session.id,
      }).token,
      session.rawRefreshToken,
    );

    const [roles, permissions, accessibleProperties] = await Promise.all([
      this.authIdentityService.listStaffRoleNames(tenantId, user.id),
      this.authIdentityService.listStaffPermissions(tenantId, user.id),
      this.authIdentityService.listStaffPropertyAccess(tenantId, user.id),
    ]);

    await this.insertAuditLog({
      tenantId,
      actorUserId: user.id,
      actorRole: roles[0] ?? 'Staff',
      action: AuthEvents.USER_LOGIN_SUCCESS,
      entityType: 'AuthSession',
      entityId: session.id,
      afterJson: {
        sessionId: session.id,
        identityType: 'STAFF',
      },
      ipAddress: request.ip,
      userAgent: this.readUserAgent(request),
    });

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        tenantId,
      },
      roles,
      permissions,
      accessibleProperties,
      requiresPasswordChange: user.mustChangePassword,
    };
  }

  async refreshStaff(request: AppRequest, response: Response) {
    const rotated = await this.rotateRefreshSession(request, 'STAFF');
    const user = await this.authIdentityService.getStaffById(rotated.tenantId!, rotated.userId!);
    if (!user || user.status !== 'active') {
      throw new UnauthorizedException(AUTH_REFRESH_INVALID);
    }

    const tenantId = rotated.tenantId;
    if (!tenantId) {
      throw new UnauthorizedException(AUTH_REFRESH_INVALID);
    }

    const [roles, permissions, accessibleProperties] = await Promise.all([
      this.authIdentityService.listStaffRoleNames(tenantId, user.id),
      this.authIdentityService.listStaffPermissions(tenantId, user.id),
      this.authIdentityService.listStaffPropertyAccess(tenantId, user.id),
    ]);

    this.setAuthCookies(
      response,
      this.authTokenService.createAccessToken({
        subjectId: user.id,
        tenantId: rotated.tenantId,
        identityType: 'staff',
        sessionId: rotated.newSessionId,
      }).token,
      rotated.rawRefreshToken,
    );

    await this.insertAuditLog({
      tenantId,
      actorUserId: user.id,
      actorRole: roles[0] ?? 'Staff',
      action: AuthEvents.USER_REFRESH_SUCCESS,
      entityType: 'AuthSession',
      entityId: rotated.newSessionId,
      afterJson: {
        previousSessionId: rotated.previousSessionId,
      },
      ipAddress: request.ip,
      userAgent: this.readUserAgent(request),
    });

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        tenantId,
      },
      roles,
      permissions,
      accessibleProperties,
      requiresPasswordChange: user.mustChangePassword,
    };
  }

  async logoutStaff(request: AppRequest, response: Response) {
    const token = this.readRefreshCookie(request);
    if (token) {
      const hash = this.authPasswordService.hashOpaqueToken(token);
      const result = await this.postgres.query<{
        id: string;
        tenant_id: string | null;
        user_id: string | null;
      }>(
        `UPDATE refresh_sessions
         SET revoked_at = NOW(),
             revoked_reason = COALESCE(revoked_reason, 'LOGOUT'),
             last_used_at = NOW()
         WHERE refresh_token_hash = $1
           AND revoked_at IS NULL
         RETURNING id::text, tenant_id::text, user_id::text`,
        [hash],
      );

      if ((result.rowCount ?? 0) > 0) {
        await this.insertAuditLog({
          tenantId: result.rows[0].tenant_id ?? request.context.tenantId,
          actorUserId: result.rows[0].user_id ?? request.context.userId,
          actorRole: request.context.role,
          action: AuthEvents.USER_LOGOUT,
          entityType: 'AuthSession',
          entityId: result.rows[0].id,
          ipAddress: request.ip,
          userAgent: this.readUserAgent(request),
        });
      }
    }

    this.clearAuthCookies(response);
    return { success: true };
  }

  async logoutAllStaff(request: AppRequest, response: Response) {
    if (request.context.identityType !== 'staff') {
      throw new UnauthorizedException(AUTH_INVALID_CREDENTIALS);
    }

    await this.postgres.query(
      `UPDATE refresh_sessions
       SET revoked_at = NOW(),
           revoked_reason = COALESCE(revoked_reason, 'LOGOUT_ALL'),
           last_used_at = NOW()
       WHERE identity_type = 'STAFF'
         AND tenant_id = $1
         AND user_id = $2
         AND revoked_at IS NULL`,
      [request.context.tenantId, request.context.userId],
    );

    await this.insertAuditLog({
      tenantId: request.context.tenantId,
      actorUserId: request.context.userId,
      actorRole: request.context.role,
      action: AuthEvents.USER_LOGOUT_ALL,
      entityType: 'AuthSession',
      entityId: randomUUID(),
      ipAddress: request.ip,
      userAgent: this.readUserAgent(request),
    });

    this.clearAuthCookies(response);
    return { success: true };
  }

  async changeStaffPassword(request: AppRequest, response: Response, dto: ChangePasswordDto) {
    if (request.context.identityType !== 'staff') {
      throw new UnauthorizedException(AUTH_INVALID_CREDENTIALS);
    }

    const user = await this.authIdentityService.getStaffById(
      request.context.tenantId,
      request.context.userId,
    );
    if (!user || user.status !== 'active') {
      throw new UnauthorizedException(AUTH_INVALID_CREDENTIALS);
    }

    if (!this.authPasswordService.verifyPassword(dto.currentPassword, user.passwordHash)) {
      throw new UnauthorizedException(AUTH_INVALID_CREDENTIALS);
    }

    const passwordHash = this.authPasswordService.hashPassword(dto.newPassword);
    await this.postgres.query(
      `UPDATE users
       SET password_hash = $1,
           must_change_password = false,
           password_changed_at = NOW(),
           updated_at = NOW()
       WHERE tenant_id = $2
         AND id = $3`,
      [passwordHash, request.context.tenantId, request.context.userId],
    );

    await this.revokeStaffSessions(request.context.tenantId, request.context.userId, 'PASSWORD_CHANGED');

    await this.insertAuditLog({
      tenantId: request.context.tenantId,
      actorUserId: request.context.userId,
      actorRole: request.context.role,
      action: AuthEvents.PASSWORD_CHANGED,
      entityType: 'User',
      entityId: request.context.userId,
      ipAddress: request.ip,
      userAgent: this.readUserAgent(request),
    });

    this.clearAuthCookies(response);
    return { success: true };
  }

  async forgotPassword(request: AppRequest, dto: ForgotPasswordDto) {
    const tenantId = request.context.tenantId;
    const { normalizedEmail, normalizedPhone } = this.normalizeIdentifier(dto.identifier);
    const user = await this.authIdentityService.getStaffByIdentifier(
      tenantId,
      dto.identifier,
      normalizedEmail,
      normalizedPhone,
    );

    if (!user || user.status !== 'active') {
      return { accepted: true };
    }

    const invite = await this.createStaffInvite({
      tenantId,
      userId: user.id,
      createdByUserId: user.id,
      expiryHours: 1,
    });

    await this.insertAuditLog({
      tenantId,
      actorUserId: user.id,
      actorRole: 'Auth',
      action: AuthEvents.PASSWORD_RESET_REQUESTED,
      entityType: 'StaffInvite',
      entityId: invite.id,
      afterJson: {
        inviteExpiresAt: invite.expiresAt,
      },
      ipAddress: request.ip,
      userAgent: this.readUserAgent(request),
    });

    return {
      accepted: true,
    };
  }

  async resetPassword(request: AppRequest, response: Response, dto: ResetPasswordDto) {
    const invite = await this.consumeInviteToken(dto.token, request);
    const user = await this.authIdentityService.getStaffById(invite.tenantId, invite.userId);
    if (!user || user.status === 'soft_deleted') {
      throw new UnauthorizedException(AUTH_INVALID_CREDENTIALS);
    }

    const passwordHash = this.authPasswordService.hashPassword(dto.newPassword);
    await this.postgres.query(
      `UPDATE users
       SET password_hash = $1,
           must_change_password = false,
           password_changed_at = NOW(),
           status = CASE WHEN status = 'deactivated' THEN status ELSE 'active' END,
           updated_at = NOW()
       WHERE tenant_id = $2
         AND id = $3`,
      [passwordHash, invite.tenantId, invite.userId],
    );

    await this.revokeStaffSessions(invite.tenantId, invite.userId, 'PASSWORD_RESET');

    const session = await this.createRefreshSession({
      identityType: 'STAFF',
      tenantId: invite.tenantId,
      userId: invite.userId,
      tokenFamilyId: randomUUID(),
      ip: request.ip,
      userAgent: this.readUserAgent(request),
    });

    this.setAuthCookies(
      response,
      this.authTokenService.createAccessToken({
        subjectId: invite.userId,
        tenantId: invite.tenantId,
        identityType: 'staff',
        sessionId: session.id,
      }).token,
      session.rawRefreshToken,
    );

    await this.insertAuditLog({
      tenantId: invite.tenantId,
      actorUserId: invite.userId,
      actorRole: 'Staff',
      action: AuthEvents.PASSWORD_RESET_COMPLETED,
      entityType: 'User',
      entityId: invite.userId,
      ipAddress: request.ip,
      userAgent: this.readUserAgent(request),
    });

    const [roles, permissions, accessibleProperties] = await Promise.all([
      this.authIdentityService.listStaffRoleNames(invite.tenantId, invite.userId),
      this.authIdentityService.listStaffPermissions(invite.tenantId, invite.userId),
      this.authIdentityService.listStaffPropertyAccess(invite.tenantId, invite.userId),
    ]);

    return {
      user: {
        id: invite.userId,
        fullName: user.fullName,
        tenantId: invite.tenantId,
      },
      roles,
      permissions,
      accessibleProperties,
      requiresPasswordChange: false,
    };
  }

  async acceptInvite(request: AppRequest, response: Response, dto: AcceptStaffInviteDto) {
    const result = await this.resetPassword(request, response, {
      token: dto.token,
      newPassword: dto.newPassword,
    });

    if (dto.fullName && result.user) {
      await this.postgres.query(
        `UPDATE users
         SET full_name = $1,
             updated_at = NOW()
         WHERE id = $2
           AND tenant_id = $3`,
        [dto.fullName, result.user.id, result.user.tenantId],
      );
      result.user.fullName = dto.fullName;
    }

    return result;
  }

  async registerGuest(request: AppRequest, response: Response, dto: GuestRegisterDto) {
    const { normalizedEmail, normalizedPhone } = this.normalizeIdentifier(dto.identifier);
    if (!normalizedEmail && !normalizedPhone) {
      throw new BadRequestException('Identifier must be a valid email or phone number');
    }

    const guestId = randomUUID();
    const passwordHash = this.authPasswordService.hashPassword(dto.password);
    try {
      await this.postgres.query(
        `INSERT INTO guests_auth (
            id,
            full_name,
            email,
            email_normalized,
            phone,
            phone_e164,
            password_hash,
            status,
            created_at,
            updated_at
          )
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', NOW(), NOW())`,
        [
          guestId,
          dto.fullName,
          normalizedEmail ?? null,
          normalizedEmail ?? null,
          normalizedPhone ?? null,
          normalizedPhone ?? null,
          passwordHash,
        ],
      );
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('Guest account already exists');
      }
      throw error;
    }

    const session = await this.createRefreshSession({
      identityType: 'GUEST',
      guestAuthId: guestId,
      tokenFamilyId: randomUUID(),
      ip: request.ip,
      userAgent: this.readUserAgent(request),
    });

    this.setAuthCookies(
      response,
      this.authTokenService.createAccessToken({
        subjectId: guestId,
        identityType: 'guest',
        sessionId: session.id,
      }).token,
      session.rawRefreshToken,
    );

    return {
      guest: {
        id: guestId,
        fullName: dto.fullName,
        email: normalizedEmail,
        phone: normalizedPhone,
      },
      permissions: Object.values(GuestPermissions),
    };
  }

  async loginGuest(request: AppRequest, response: Response, dto: GuestLoginDto) {
    const { normalizedEmail, normalizedPhone } = this.normalizeIdentifier(dto.identifier);
    const guest = await this.authIdentityService.getGuestAuthByIdentifier(
      dto.identifier,
      normalizedEmail,
      normalizedPhone,
    );

    const credentialsValid =
      guest != null &&
      guest.status === 'active' &&
      this.authPasswordService.verifyPassword(dto.password, guest.passwordHash);

    if (!credentialsValid || !guest) {
      throw new UnauthorizedException(AUTH_INVALID_CREDENTIALS);
    }

    const session = await this.createRefreshSession({
      identityType: 'GUEST',
      guestAuthId: guest.id,
      tokenFamilyId: randomUUID(),
      ip: request.ip,
      userAgent: this.readUserAgent(request),
    });

    this.setAuthCookies(
      response,
      this.authTokenService.createAccessToken({
        subjectId: guest.id,
        identityType: 'guest',
        sessionId: session.id,
      }).token,
      session.rawRefreshToken,
    );

    return {
      guest: this.mapGuestProfile(guest),
      permissions: Object.values(GuestPermissions),
    };
  }

  async refreshGuest(request: AppRequest, response: Response) {
    const rotated = await this.rotateRefreshSession(request, 'GUEST');
    const guest = await this.authIdentityService.getGuestAuthById(rotated.guestAuthId!);
    if (!guest || guest.status !== 'active') {
      throw new UnauthorizedException(AUTH_REFRESH_INVALID);
    }

    this.setAuthCookies(
      response,
      this.authTokenService.createAccessToken({
        subjectId: guest.id,
        identityType: 'guest',
        sessionId: rotated.newSessionId,
      }).token,
      rotated.rawRefreshToken,
    );

    return {
      guest: this.mapGuestProfile(guest),
      permissions: Object.values(GuestPermissions),
    };
  }

  async logoutGuest(request: AppRequest, response: Response) {
    const token = this.readRefreshCookie(request);
    if (token) {
      const hash = this.authPasswordService.hashOpaqueToken(token);
      await this.postgres.query(
        `UPDATE refresh_sessions
         SET revoked_at = NOW(),
             revoked_reason = COALESCE(revoked_reason, 'LOGOUT'),
             last_used_at = NOW()
         WHERE refresh_token_hash = $1
           AND revoked_at IS NULL`,
        [hash],
      );
    }

    this.clearAuthCookies(response);
    return { success: true };
  }

  async changeGuestPassword(request: AppRequest, response: Response, dto: ChangePasswordDto) {
    if (request.context.identityType !== 'guest') {
      throw new UnauthorizedException(AUTH_INVALID_CREDENTIALS);
    }

    const guest = await this.authIdentityService.getGuestAuthById(request.context.userId);
    if (!guest || guest.status !== 'active') {
      throw new UnauthorizedException(AUTH_INVALID_CREDENTIALS);
    }

    if (!this.authPasswordService.verifyPassword(dto.currentPassword, guest.passwordHash)) {
      throw new UnauthorizedException(AUTH_INVALID_CREDENTIALS);
    }

    await this.postgres.query(
      `UPDATE guests_auth
       SET password_hash = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [this.authPasswordService.hashPassword(dto.newPassword), guest.id],
    );

    await this.revokeGuestSessions(guest.id, 'PASSWORD_CHANGED');
    this.clearAuthCookies(response);

    return { success: true };
  }

  async getStaffSession(request: AppRequest) {
    if (request.context.identityType !== 'staff') {
      throw new UnauthorizedException(AUTH_INVALID_CREDENTIALS);
    }

    const tenantId = request.context.tenantId;
    const user = await this.authIdentityService.getStaffById(tenantId, request.context.userId);
    if (!user || user.status !== 'active') {
      throw new UnauthorizedException(AUTH_INVALID_CREDENTIALS);
    }

    const [roles, permissions, accessibleProperties] = await Promise.all([
      this.authIdentityService.listStaffRoleNames(tenantId, user.id),
      this.authIdentityService.listStaffPermissions(tenantId, user.id),
      this.authIdentityService.listStaffPropertyAccess(tenantId, user.id),
    ]);

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        tenantId,
      },
      roles,
      permissions,
      accessibleProperties,
      requiresPasswordChange: user.mustChangePassword,
    };
  }

  async getGuestSession(request: AppRequest) {
    if (request.context.identityType !== 'guest') {
      throw new UnauthorizedException(AUTH_INVALID_CREDENTIALS);
    }

    const guest = await this.authIdentityService.getGuestAuthById(request.context.userId);
    if (!guest || guest.status !== 'active') {
      throw new UnauthorizedException(AUTH_INVALID_CREDENTIALS);
    }

    return {
      guest: this.mapGuestProfile(guest),
      permissions: Object.values(GuestPermissions),
    };
  }

  async listStaff(propertyId: string, request: AppRequest, query: ListStaffDto) {
    const rows = await this.postgres.query<{
      id: string;
      full_name: string;
      email: string | null;
      phone: string | null;
      status: string;
      must_change_password: boolean;
      created_at: Date;
      updated_at: Date;
      role_names: string[];
      property_access_ids: string[];
    }>(
      `SELECT u.id::text,
              u.full_name::text,
              u.email::text,
              u.phone::text,
              u.status::text,
              u.must_change_password,
              u.created_at,
              u.updated_at,
              COALESCE(
                ARRAY_REMOVE(ARRAY_AGG(DISTINCT r.name::text), NULL),
                ARRAY[]::text[]
              ) AS role_names,
              COALESCE(
                ARRAY_REMOVE(ARRAY_AGG(DISTINCT upa_all.property_id::text), NULL),
                ARRAY[]::text[]
              ) AS property_access_ids
       FROM users u
       JOIN user_property_access upa_scope
         ON upa_scope.tenant_id = u.tenant_id
        AND upa_scope.user_id = u.id
        AND upa_scope.property_id = $2
       LEFT JOIN user_roles ur
         ON ur.tenant_id = u.tenant_id
        AND ur.user_id = u.id
       LEFT JOIN roles r
         ON r.tenant_id = ur.tenant_id
        AND r.id = ur.role_id
       LEFT JOIN user_property_access upa_all
         ON upa_all.tenant_id = u.tenant_id
        AND upa_all.user_id = u.id
       WHERE u.tenant_id = $1
         AND ($3::text IS NULL OR u.status::text = $3)
         AND (
           $4::text IS NULL
           OR u.full_name ILIKE '%' || $4 || '%'
           OR COALESCE(u.email, '') ILIKE '%' || $4 || '%'
           OR COALESCE(u.phone, '') ILIKE '%' || $4 || '%'
         )
       GROUP BY u.id, u.full_name, u.email, u.phone, u.status, u.must_change_password, u.created_at, u.updated_at
       ORDER BY u.full_name ASC`,
      [
        request.context.tenantId,
        propertyId,
        query.status ?? null,
        query.q?.trim() ? query.q.trim() : null,
      ],
    );

    return {
      count: rows.rowCount,
      rows: rows.rows.map((row) => ({
        id: row.id,
        fullName: row.full_name,
        email: row.email ?? undefined,
        phone: row.phone ?? undefined,
        status: row.status,
        mustChangePassword: row.must_change_password,
        roles: row.role_names ?? [],
        propertyAccessIds: row.property_access_ids ?? [],
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
      })),
    };
  }

  async createStaff(propertyId: string, request: AppRequest, dto: CreateStaffDto) {
    const tenantId = request.context.tenantId;
    if (!dto.propertyAccessIds.includes(propertyId)) {
      throw new BadRequestException('propertyAccessIds must include the current property context');
    }
    await this.ensurePropertyBelongsToTenant(tenantId, dto.propertyAccessIds);
    await this.ensureRoleIdsBelongToTenant(tenantId, dto.roleIds);

    const actorRoles = await this.authIdentityService.listStaffRoleNames(
      tenantId,
      request.context.userId,
    );
    await this.assertPrivilegedRoleAssignmentAllowed(tenantId, dto.roleIds, actorRoles);

    const userId = randomUUID();
    const normalizedEmail = this.authPasswordService.normalizeEmail(dto.email);
    const normalizedPhone = this.authPasswordService.normalizePhone(dto.phone);

    try {
      await this.postgres.query(
        `INSERT INTO users (
            id,
            tenant_id,
            full_name,
            phone,
            email,
            phone_e164,
            email_normalized,
            auth_provider,
            status,
            must_change_password,
            created_at,
            updated_at
          )
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'password', 'active', true, NOW(), NOW())`,
        [
          userId,
          tenantId,
          dto.fullName,
          dto.phone,
          dto.email ?? null,
          normalizedPhone ?? null,
          normalizedEmail ?? null,
        ],
      );
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('Staff identifier already exists');
      }
      throw error;
    }

    await this.replaceStaffRoles(tenantId, userId, dto.roleIds);
    await this.replaceStaffPropertyAccess(tenantId, userId, dto.propertyAccessIds);

    const invite = await this.createStaffInvite({
      tenantId,
      userId,
      createdByUserId: request.context.userId,
      expiryHours: 72,
    });

    await this.insertAuditLog({
      tenantId,
      propertyId,
      actorUserId: request.context.userId,
      actorRole: request.context.role,
      action: AuthEvents.STAFF_CREATED,
      entityType: 'User',
      entityId: userId,
      afterJson: {
        roleIds: dto.roleIds,
        propertyAccessIds: dto.propertyAccessIds,
      },
      ipAddress: request.ip,
      userAgent: this.readUserAgent(request),
    });

    return {
      id: userId,
      fullName: dto.fullName,
      phone: dto.phone,
      email: dto.email,
      status: 'active',
      mustChangePassword: true,
      roleIds: dto.roleIds,
      propertyAccessIds: dto.propertyAccessIds,
      invite: {
        token: invite.rawToken,
        expiresAt: invite.expiresAt,
        inviteLink: this.buildInviteLink(invite.rawToken),
      },
    };
  }

  async updateStaff(propertyId: string, userId: string, request: AppRequest, dto: UpdateStaffDto) {
    const tenantId = request.context.tenantId;
    const user = await this.authIdentityService.getStaffById(tenantId, userId);
    if (!user) {
      throw new NotFoundException('Staff user not found');
    }

    const actorRoles = await this.authIdentityService.listStaffRoleNames(
      tenantId,
      request.context.userId,
    );
    await this.assertTargetManagementAllowed(tenantId, userId, actorRoles);

    if (dto.roleIds) {
      await this.ensureRoleIdsBelongToTenant(tenantId, dto.roleIds);
      await this.assertPrivilegedRoleAssignmentAllowed(tenantId, dto.roleIds, actorRoles);
      await this.replaceStaffRoles(tenantId, userId, dto.roleIds);
    }

    if (dto.propertyAccessIds) {
      if (!dto.propertyAccessIds.includes(propertyId)) {
        throw new BadRequestException(
          'propertyAccessIds must include the current property context',
        );
      }
      await this.ensurePropertyBelongsToTenant(tenantId, dto.propertyAccessIds);
      await this.replaceStaffPropertyAccess(tenantId, userId, dto.propertyAccessIds);
    }

    const fullName = dto.fullName ?? user.fullName;
    const phone = dto.phone ?? user.phone ?? null;
    const email = dto.email ?? user.email ?? null;

    try {
      await this.postgres.query(
        `UPDATE users
         SET full_name = $1,
             phone = $2,
             email = $3,
             phone_e164 = $4,
             email_normalized = $5,
             updated_at = NOW()
         WHERE tenant_id = $6
           AND id = $7`,
        [
          fullName,
          phone,
          email,
          this.authPasswordService.normalizePhone(phone) ?? null,
          this.authPasswordService.normalizeEmail(email) ?? null,
          tenantId,
          userId,
        ],
      );
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('Staff identifier already exists');
      }
      throw error;
    }

    await this.insertAuditLog({
      tenantId,
      propertyId,
      actorUserId: request.context.userId,
      actorRole: request.context.role,
      action: AuthEvents.STAFF_UPDATED,
      entityType: 'User',
      entityId: userId,
      afterJson: dto,
      ipAddress: request.ip,
      userAgent: this.readUserAgent(request),
    });

    return {
      id: userId,
      fullName,
      phone: phone ?? undefined,
      email: email ?? undefined,
      roleIds: dto.roleIds,
      propertyAccessIds: dto.propertyAccessIds,
    };
  }

  async deactivateStaff(
    propertyId: string,
    userId: string,
    request: AppRequest,
    dto: DeactivateStaffDto,
  ) {
    const tenantId = request.context.tenantId;
    await this.assertTargetManagementAllowed(
      tenantId,
      userId,
      await this.authIdentityService.listStaffRoleNames(tenantId, request.context.userId),
    );

    const updated = await this.postgres.query(
      `UPDATE users
       SET status = 'deactivated',
           updated_at = NOW()
       WHERE tenant_id = $1
         AND id = $2
       RETURNING id::text`,
      [tenantId, userId],
    );
    if (!updated.rowCount) {
      throw new NotFoundException('Staff user not found');
    }
    await this.revokeStaffSessions(tenantId, userId, 'ACCOUNT_DEACTIVATED');

    await this.insertAuditLog({
      tenantId,
      propertyId,
      actorUserId: request.context.userId,
      actorRole: request.context.role,
      action: AuthEvents.STAFF_DEACTIVATED,
      entityType: 'User',
      entityId: userId,
      afterJson: { reason: dto.reason },
      ipAddress: request.ip,
      userAgent: this.readUserAgent(request),
    });

    return {
      id: userId,
      status: 'deactivated',
    };
  }

  async activateStaff(propertyId: string, userId: string, request: AppRequest) {
    const tenantId = request.context.tenantId;
    await this.assertTargetManagementAllowed(
      tenantId,
      userId,
      await this.authIdentityService.listStaffRoleNames(tenantId, request.context.userId),
    );

    const updated = await this.postgres.query(
      `UPDATE users
       SET status = 'active',
           updated_at = NOW()
       WHERE tenant_id = $1
         AND id = $2
       RETURNING id::text`,
      [tenantId, userId],
    );
    if (!updated.rowCount) {
      throw new NotFoundException('Staff user not found');
    }

    await this.insertAuditLog({
      tenantId,
      propertyId,
      actorUserId: request.context.userId,
      actorRole: request.context.role,
      action: AuthEvents.STAFF_ACTIVATED,
      entityType: 'User',
      entityId: userId,
      ipAddress: request.ip,
      userAgent: this.readUserAgent(request),
    });

    return {
      id: userId,
      status: 'active',
    };
  }

  async resetStaffPassword(
    propertyId: string,
    userId: string,
    request: AppRequest,
    dto: StaffResetPasswordDto,
  ) {
    const tenantId = request.context.tenantId;
    await this.assertTargetManagementAllowed(
      tenantId,
      userId,
      await this.authIdentityService.listStaffRoleNames(tenantId, request.context.userId),
    );

    await this.revokeStaffSessions(tenantId, userId, 'ADMIN_PASSWORD_RESET');

    const invite = await this.createStaffInvite({
      tenantId,
      userId,
      createdByUserId: request.context.userId,
      expiryHours: dto.inviteExpiryHours ?? 48,
    });

    const updated = await this.postgres.query(
      `UPDATE users
       SET must_change_password = true,
           updated_at = NOW()
       WHERE tenant_id = $1
         AND id = $2
       RETURNING id::text`,
      [tenantId, userId],
    );
    if (!updated.rowCount) {
      throw new NotFoundException('Staff user not found');
    }

    await this.insertAuditLog({
      tenantId,
      propertyId,
      actorUserId: request.context.userId,
      actorRole: request.context.role,
      action: AuthEvents.STAFF_PASSWORD_RESET,
      entityType: 'User',
      entityId: userId,
      afterJson: { reason: dto.reason, inviteExpiresAt: invite.expiresAt },
      ipAddress: request.ip,
      userAgent: this.readUserAgent(request),
    });

    return {
      id: userId,
      invite: {
        token: invite.rawToken,
        expiresAt: invite.expiresAt,
        inviteLink: this.buildInviteLink(invite.rawToken),
      },
    };
  }

  async softDeleteStaff(
    propertyId: string,
    userId: string,
    request: AppRequest,
    dto: SoftDeleteStaffDto,
  ) {
    const tenantId = request.context.tenantId;
    await this.assertTargetManagementAllowed(
      tenantId,
      userId,
      await this.authIdentityService.listStaffRoleNames(tenantId, request.context.userId),
    );

    const updated = await this.postgres.query(
      `UPDATE users
       SET status = 'soft_deleted',
           deleted_at = NOW(),
           deleted_reason = $1,
           deleted_by_user_id = $2,
           updated_at = NOW()
       WHERE tenant_id = $3
         AND id = $4
       RETURNING id::text`,
      [dto.reason, request.context.userId, tenantId, userId],
    );
    if (!updated.rowCount) {
      throw new NotFoundException('Staff user not found');
    }

    await this.revokeStaffSessions(tenantId, userId, 'ACCOUNT_SOFT_DELETED');

    await this.insertAuditLog({
      tenantId,
      propertyId,
      actorUserId: request.context.userId,
      actorRole: request.context.role,
      action: AuthEvents.STAFF_SOFT_DELETED,
      entityType: 'User',
      entityId: userId,
      afterJson: { reason: dto.reason },
      ipAddress: request.ip,
      userAgent: this.readUserAgent(request),
    });

    return {
      id: userId,
      status: 'soft_deleted',
    };
  }

  private async createRefreshSession(input: {
    identityType: 'STAFF' | 'GUEST';
    tenantId?: string;
    userId?: string;
    guestAuthId?: string;
    tokenFamilyId: string;
    ip?: string;
    userAgent?: string;
  }) {
    const sessionId = randomUUID();
    const rawRefreshToken = this.authTokenService.generateRefreshToken();
    const refreshTokenHash = this.authPasswordService.hashOpaqueToken(rawRefreshToken);

    await this.postgres.query(
      `INSERT INTO refresh_sessions (
          id,
          identity_type,
          tenant_id,
          user_id,
          guest_auth_id,
          token_family_id,
          refresh_token_hash,
          created_at,
          expires_at,
          ip,
          user_agent
        )
       VALUES (
         $1,
         $2,
         $3,
         $4,
         $5,
         $6,
         $7,
         NOW(),
         NOW() + INTERVAL '30 days',
         $8,
         $9
       )`,
      [
        sessionId,
        input.identityType,
        input.tenantId ?? null,
        input.userId ?? null,
        input.guestAuthId ?? null,
        input.tokenFamilyId,
        refreshTokenHash,
        input.ip ?? null,
        input.userAgent ?? null,
      ],
    );

    return {
      id: sessionId,
      rawRefreshToken,
    };
  }

  private async rotateRefreshSession(request: AppRequest, expectedIdentity: 'STAFF' | 'GUEST') {
    const token = this.readRefreshCookie(request);
    if (!token) {
      throw new UnauthorizedException(AUTH_REFRESH_INVALID);
    }

    const refreshHash = this.authPasswordService.hashOpaqueToken(token);
    const session = await this.getRefreshSessionByHash(refreshHash);
    if (!session) {
      throw new UnauthorizedException(AUTH_REFRESH_INVALID);
    }

    if (session.identityType !== expectedIdentity) {
      throw new UnauthorizedException(AUTH_REFRESH_INVALID);
    }

    if (session.revokedAt) {
      if (session.replacedBySessionId) {
        await this.revokeSessionFamily(session.tokenFamilyId, 'REUSE_DETECTED');
      }
      throw new UnauthorizedException(AUTH_REFRESH_INVALID);
    }

    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      await this.postgres.query(
        `UPDATE refresh_sessions
         SET revoked_at = NOW(),
             revoked_reason = COALESCE(revoked_reason, 'EXPIRED'),
             last_used_at = NOW()
         WHERE id = $1`,
        [session.id],
      );
      throw new UnauthorizedException(AUTH_REFRESH_INVALID);
    }

    const replacement = await this.createRefreshSession({
      identityType: session.identityType,
      tenantId: session.tenantId,
      userId: session.userId,
      guestAuthId: session.guestAuthId,
      tokenFamilyId: session.tokenFamilyId,
      ip: request.ip,
      userAgent: this.readUserAgent(request),
    });

    await this.postgres.query(
      `UPDATE refresh_sessions
       SET revoked_at = NOW(),
           revoked_reason = 'ROTATED',
           replaced_by_session_id = $1,
           last_used_at = NOW()
       WHERE id = $2
         AND revoked_at IS NULL`,
      [replacement.id, session.id],
    );

    return {
      previousSessionId: session.id,
      newSessionId: replacement.id,
      rawRefreshToken: replacement.rawRefreshToken,
      tenantId: session.tenantId,
      userId: session.userId,
      guestAuthId: session.guestAuthId,
    };
  }

  private async getRefreshSessionByHash(refreshTokenHash: string): Promise<RefreshSessionRecord | null> {
    const result = await this.postgres.query<{
      id: string;
      identity_type: 'STAFF' | 'GUEST';
      tenant_id: string | null;
      user_id: string | null;
      guest_auth_id: string | null;
      token_family_id: string;
      expires_at: Date;
      revoked_at: Date | null;
      replaced_by_session_id: string | null;
    }>(
      `SELECT id::text,
              identity_type,
              tenant_id::text,
              user_id::text,
              guest_auth_id::text,
              token_family_id::text,
              expires_at,
              revoked_at,
              replaced_by_session_id::text
       FROM refresh_sessions
       WHERE refresh_token_hash = $1
       LIMIT 1`,
      [refreshTokenHash],
    );

    if (!result.rowCount) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      identityType: row.identity_type,
      tenantId: row.tenant_id ?? undefined,
      userId: row.user_id ?? undefined,
      guestAuthId: row.guest_auth_id ?? undefined,
      tokenFamilyId: row.token_family_id,
      expiresAt: row.expires_at.toISOString(),
      revokedAt: row.revoked_at ? row.revoked_at.toISOString() : undefined,
      replacedBySessionId: row.replaced_by_session_id ?? undefined,
    };
  }

  private async revokeSessionFamily(tokenFamilyId: string, reason: string) {
    await this.postgres.query(
      `UPDATE refresh_sessions
       SET revoked_at = COALESCE(revoked_at, NOW()),
           revoked_reason = COALESCE(revoked_reason, $2),
           reuse_detected_at = COALESCE(reuse_detected_at, NOW())
       WHERE token_family_id = $1`,
      [tokenFamilyId, reason],
    );
  }

  private async revokeStaffSessions(tenantId: string, userId: string, reason: string) {
    await this.postgres.query(
      `UPDATE refresh_sessions
       SET revoked_at = COALESCE(revoked_at, NOW()),
           revoked_reason = COALESCE(revoked_reason, $3),
           last_used_at = NOW()
       WHERE identity_type = 'STAFF'
         AND tenant_id = $1
         AND user_id = $2`,
      [tenantId, userId, reason],
    );
  }

  private async revokeGuestSessions(guestAuthId: string, reason: string) {
    await this.postgres.query(
      `UPDATE refresh_sessions
       SET revoked_at = COALESCE(revoked_at, NOW()),
           revoked_reason = COALESCE(revoked_reason, $2),
           last_used_at = NOW()
       WHERE identity_type = 'GUEST'
         AND guest_auth_id = $1`,
      [guestAuthId, reason],
    );
  }

  private async recordFailedStaffLogin(userId: string, tenantId: string) {
    await this.postgres.query(
      `UPDATE users
       SET failed_login_attempts = COALESCE(failed_login_attempts, 0) + 1,
           locked_until = CASE
             WHEN COALESCE(failed_login_attempts, 0) + 1 >= $3
               THEN NOW() + ($4::text || ' minutes')::interval
             ELSE locked_until
           END,
           updated_at = NOW()
       WHERE id = $1
         AND tenant_id = $2`,
      [userId, tenantId, STAFF_LOCKOUT_ATTEMPTS, STAFF_LOCKOUT_MINUTES],
    );
  }

  private async createStaffInvite(input: {
    tenantId: string;
    userId: string;
    createdByUserId: string;
    expiryHours: number;
  }) {
    const inviteId = randomUUID();
    const rawToken = this.authTokenService.generateRefreshToken();
    const tokenHash = this.authPasswordService.hashOpaqueToken(rawToken);
    const hours = Math.max(1, Math.min(input.expiryHours, 168));

    const result = await this.postgres.query<{
      id: string;
      tenant_id: string;
      user_id: string;
      expires_at: Date;
    }>(
      `INSERT INTO staff_invites (
          id,
          tenant_id,
          user_id,
          invite_token_hash,
          expires_at,
          created_by_user_id,
          created_at
        )
       VALUES ($1, $2, $3, $4, NOW() + ($5::text || ' hours')::interval, $6, NOW())
       RETURNING id::text, tenant_id::text, user_id::text, expires_at`,
      [inviteId, input.tenantId, input.userId, tokenHash, hours, input.createdByUserId],
    );

    return {
      id: result.rows[0].id,
      tenantId: result.rows[0].tenant_id,
      userId: result.rows[0].user_id,
      expiresAt: result.rows[0].expires_at.toISOString(),
      rawToken,
    };
  }

  private async consumeInviteToken(token: string, request: AppRequest): Promise<InviteRecord> {
    const tokenHash = this.authPasswordService.hashOpaqueToken(token);
    const result = await this.postgres.query<{
      id: string;
      tenant_id: string;
      user_id: string;
      expires_at: Date;
      accepted_at: Date | null;
    }>(
      `SELECT id::text, tenant_id::text, user_id::text, expires_at, accepted_at
       FROM staff_invites
       WHERE invite_token_hash = $1
       LIMIT 1`,
      [tokenHash],
    );

    if (!result.rowCount) {
      throw new UnauthorizedException(AUTH_INVALID_CREDENTIALS);
    }

    const row = result.rows[0];
    if (row.accepted_at || row.expires_at.getTime() <= Date.now()) {
      throw new UnauthorizedException(AUTH_INVALID_CREDENTIALS);
    }

    await this.postgres.query(
      `UPDATE staff_invites
       SET accepted_at = NOW(),
           accepted_ip = $2,
           accepted_user_agent = $3
       WHERE id = $1`,
      [row.id, request.ip ?? null, this.readUserAgent(request) ?? null],
    );

    return {
      id: row.id,
      tenantId: row.tenant_id,
      userId: row.user_id,
      expiresAt: row.expires_at.toISOString(),
      acceptedAt: undefined,
    };
  }

  private async ensurePropertyBelongsToTenant(tenantId: string, propertyIds: string[]) {
    const rows = await this.postgres.query<{ id: string }>(
      `SELECT id::text
       FROM properties
       WHERE tenant_id = $1
         AND id = ANY($2::uuid[])`,
      [tenantId, propertyIds],
    );

    if (rows.rowCount !== propertyIds.length) {
      throw new BadRequestException('One or more property IDs are invalid for tenant scope');
    }
  }

  private async ensureRoleIdsBelongToTenant(tenantId: string, roleIds: string[]) {
    const rows = await this.postgres.query<{ id: string }>(
      `SELECT id::text
       FROM roles
       WHERE tenant_id = $1
         AND id = ANY($2::uuid[])`,
      [tenantId, roleIds],
    );

    if (rows.rowCount !== roleIds.length) {
      throw new BadRequestException('One or more role IDs are invalid for tenant scope');
    }
  }

  private async replaceStaffRoles(tenantId: string, userId: string, roleIds: string[]) {
    await this.postgres.query(
      `DELETE FROM user_roles
       WHERE tenant_id = $1
         AND user_id = $2`,
      [tenantId, userId],
    );

    for (const roleId of roleIds) {
      await this.postgres.query(
        `INSERT INTO user_roles (id, tenant_id, user_id, role_id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, role_id) DO NOTHING`,
        [randomUUID(), tenantId, userId, roleId],
      );
    }
  }

  private async replaceStaffPropertyAccess(tenantId: string, userId: string, propertyIds: string[]) {
    await this.postgres.query(
      `DELETE FROM user_property_access
       WHERE tenant_id = $1
         AND user_id = $2`,
      [tenantId, userId],
    );

    for (const propertyId of propertyIds) {
      await this.postgres.query(
        `INSERT INTO user_property_access (
            id,
            tenant_id,
            user_id,
            property_id,
            access_level,
            created_at,
            updated_at
          )
         VALUES ($1, $2, $3, $4, 'operate', NOW(), NOW())
         ON CONFLICT (user_id, property_id)
         DO UPDATE
           SET access_level = EXCLUDED.access_level,
               updated_at = NOW()`,
        [randomUUID(), tenantId, userId, propertyId],
      );
    }
  }

  private async assertTargetManagementAllowed(
    tenantId: string,
    targetUserId: string,
    actorRoleNames: string[],
  ) {
    const targetRoles = await this.authIdentityService.listStaffRoleNames(tenantId, targetUserId);
    const targetIsPrivileged = targetRoles.includes('Owner') || targetRoles.includes('PlatformAdmin');
    if (!targetIsPrivileged) {
      return;
    }

    const actorIsPrivileged = actorRoleNames.includes('Owner') || actorRoleNames.includes('PlatformAdmin');
    if (!actorIsPrivileged) {
      throw new ForbiddenException('Insufficient privilege to manage this account');
    }
  }

  private async assertPrivilegedRoleAssignmentAllowed(
    tenantId: string,
    roleIds: string[],
    actorRoleNames: string[],
  ) {
    const targetRoles = await this.postgres.query<{ name: string }>(
      `SELECT name::text
       FROM roles
       WHERE tenant_id = $1
         AND id = ANY($2::uuid[])`,
      [tenantId, roleIds],
    );

    const includesPrivilegedRole = targetRoles.rows.some(
      (row) => row.name === 'Owner' || row.name === 'PlatformAdmin',
    );
    if (!includesPrivilegedRole) {
      return;
    }

    const actorCanManagePrivileged =
      actorRoleNames.includes('Owner') || actorRoleNames.includes('PlatformAdmin');
    if (!actorCanManagePrivileged) {
      throw new ForbiddenException('Insufficient privilege to assign privileged roles');
    }
  }

  private setAuthCookies(response: Response, accessToken: string, refreshToken: string) {
    const names = this.authTokenService.cookieNames();
    const options = this.authTokenService.getCookieOptions();
    const csrfToken = this.authTokenService.generateCsrfToken();

    response.cookie(names.access, accessToken, options.access);
    response.cookie(names.refresh, refreshToken, options.refresh);
    response.cookie(names.csrf, csrfToken, options.csrf);
  }

  private clearAuthCookies(response: Response) {
    const names = this.authTokenService.cookieNames();
    const options = this.authTokenService.getCookieOptions();

    response.clearCookie(names.access, options.access);
    response.clearCookie(names.refresh, options.refresh);
    response.clearCookie(names.csrf, options.csrf);
  }

  private readRefreshCookie(request: AppRequest): string | undefined {
    const rawCookie = this.readHeader(request.headers.cookie);
    if (!rawCookie) {
      return undefined;
    }

    const parsed = parseCookies(rawCookie);
    const refreshCookieName = this.authTokenService.cookieNames().refresh;
    const refresh = parsed[refreshCookieName];
    return typeof refresh === 'string' && refresh.length > 0 ? refresh : undefined;
  }

  private normalizeIdentifier(identifier: string) {
    const normalizedEmail = this.authPasswordService.normalizeEmail(identifier);
    const normalizedPhone = this.authPasswordService.normalizePhone(identifier);
    return {
      normalizedEmail,
      normalizedPhone,
    };
  }

  private mapGuestProfile(guest: GuestAuthRecord) {
    return {
      id: guest.id,
      fullName: guest.fullName,
      email: guest.emailNormalized,
      phone: guest.phoneE164,
    };
  }

  private isLocked(user: StaffIdentityRecord): boolean {
    if (!user.lockedUntil) {
      return false;
    }

    return new Date(user.lockedUntil).getTime() > Date.now();
  }

  private buildInviteLink(rawToken: string): string {
    const baseUrl = process.env.STAFF_INVITE_BASE_URL ?? 'https://app.meshva.local/staff/invite';
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}token=${encodeURIComponent(rawToken)}`;
  }

  private async insertAuditLog(input: {
    tenantId: string;
    propertyId?: string;
    actorUserId?: string;
    actorRole?: string;
    action: string;
    entityType: string;
    entityId: string;
    beforeJson?: unknown;
    afterJson?: unknown;
    ipAddress?: string;
    userAgent?: string;
  }) {
    await this.postgres.query(
      `INSERT INTO audit_logs (
          id,
          tenant_id,
          property_id,
          actor_user_id,
          actor_role,
          action,
          entity_type,
          entity_id,
          before_json,
          after_json,
          ip_address,
          user_agent,
          created_at
        )
       VALUES (
         $1,
         $2,
         $3,
         $4,
         $5,
         $6,
         $7,
         $8,
         $9::jsonb,
         $10::jsonb,
         $11,
         $12,
         NOW()
       )`,
      [
        randomUUID(),
        input.tenantId,
        input.propertyId ?? null,
        input.actorUserId ?? null,
        input.actorRole ?? null,
        input.action,
        input.entityType,
        input.entityId,
        input.beforeJson != null ? JSON.stringify(input.beforeJson) : null,
        input.afterJson != null ? JSON.stringify(input.afterJson) : null,
        input.ipAddress ?? null,
        input.userAgent ?? null,
      ],
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

  private readUserAgent(request: AppRequest): string | undefined {
    return this.readHeader(request.headers['user-agent']);
  }

  private isUniqueViolation(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }
    return 'code' in error && (error as { code?: string }).code === '23505';
  }

  private maskIdentifier(identifier: string): string {
    const trimmed = identifier.trim();
    if (trimmed.length <= 3) {
      return '***';
    }

    return `${trimmed.slice(0, 2)}***${trimmed.slice(-1)}`;
  }
}
