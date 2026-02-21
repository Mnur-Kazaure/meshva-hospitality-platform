import { Injectable } from '@nestjs/common';
import { PostgresService } from '../persistence/db/postgres.service';

export interface StaffIdentityRecord {
  id: string;
  tenantId: string;
  fullName: string;
  email?: string;
  phone?: string;
  emailNormalized?: string;
  phoneE164?: string;
  passwordHash?: string;
  status: string;
  mustChangePassword: boolean;
  failedLoginAttempts: number;
  lockedUntil?: string;
}

export interface GuestAuthRecord {
  id: string;
  fullName: string;
  emailNormalized?: string;
  phoneE164?: string;
  passwordHash: string;
  status: string;
}

export interface StaffPropertyAccessRecord {
  propertyId: string;
  accessLevel: string;
}

@Injectable()
export class AuthIdentityService {
  constructor(private readonly postgres: PostgresService) {}

  async getStaffById(tenantId: string, userId: string): Promise<StaffIdentityRecord | null> {
    const result = await this.postgres.query<{
      id: string;
      tenant_id: string;
      full_name: string;
      email: string | null;
      phone: string | null;
      email_normalized: string | null;
      phone_e164: string | null;
      password_hash: string | null;
      status: string;
      must_change_password: boolean;
      failed_login_attempts: number;
      locked_until: Date | null;
    }>(
      `SELECT id::text,
              tenant_id::text,
              full_name::text,
              email::text,
              phone::text,
              email_normalized::text,
              phone_e164::text,
              password_hash::text,
              status::text,
              must_change_password,
              failed_login_attempts,
              locked_until
       FROM users
       WHERE tenant_id = $1
         AND id = $2
       LIMIT 1`,
      [tenantId, userId],
    );

    if (!result.rowCount) {
      return null;
    }

    return this.mapStaffIdentity(result.rows[0]);
  }

  async getStaffByIdentifier(
    tenantId: string,
    identifier: string,
    normalizedEmail?: string,
    normalizedPhone?: string,
  ): Promise<StaffIdentityRecord | null> {
    const result = await this.postgres.query<{
      id: string;
      tenant_id: string;
      full_name: string;
      email: string | null;
      phone: string | null;
      email_normalized: string | null;
      phone_e164: string | null;
      password_hash: string | null;
      status: string;
      must_change_password: boolean;
      failed_login_attempts: number;
      locked_until: Date | null;
    }>(
      `SELECT id::text,
              tenant_id::text,
              full_name::text,
              email::text,
              phone::text,
              email_normalized::text,
              phone_e164::text,
              password_hash::text,
              status::text,
              must_change_password,
              failed_login_attempts,
              locked_until
       FROM users
       WHERE tenant_id = $1
         AND (
           ($2::text IS NOT NULL AND email_normalized = $2)
           OR
           ($3::text IS NOT NULL AND phone_e164 = $3)
           OR
           (email = $4)
           OR
           (phone = $4)
         )
       ORDER BY updated_at DESC
       LIMIT 1`,
      [tenantId, normalizedEmail ?? null, normalizedPhone ?? null, identifier],
    );

    if (!result.rowCount) {
      return null;
    }

    return this.mapStaffIdentity(result.rows[0]);
  }

  async getGuestAuthById(guestAuthId: string): Promise<GuestAuthRecord | null> {
    const result = await this.postgres.query<{
      id: string;
      full_name: string;
      email_normalized: string | null;
      phone_e164: string | null;
      password_hash: string;
      status: string;
    }>(
      `SELECT id::text,
              full_name::text,
              email_normalized::text,
              phone_e164::text,
              password_hash::text,
              status::text
       FROM guests_auth
       WHERE id = $1
       LIMIT 1`,
      [guestAuthId],
    );

    if (!result.rowCount) {
      return null;
    }

    return this.mapGuestAuth(result.rows[0]);
  }

  async getGuestAuthByIdentifier(
    identifier: string,
    normalizedEmail?: string,
    normalizedPhone?: string,
  ): Promise<GuestAuthRecord | null> {
    const result = await this.postgres.query<{
      id: string;
      full_name: string;
      email_normalized: string | null;
      phone_e164: string | null;
      password_hash: string;
      status: string;
    }>(
      `SELECT id::text,
              full_name::text,
              email_normalized::text,
              phone_e164::text,
              password_hash::text,
              status::text
       FROM guests_auth
       WHERE (
           ($1::text IS NOT NULL AND email_normalized = $1)
           OR
           ($2::text IS NOT NULL AND phone_e164 = $2)
           OR
           (email = $3)
           OR
           (phone = $3)
         )
       ORDER BY updated_at DESC
       LIMIT 1`,
      [normalizedEmail ?? null, normalizedPhone ?? null, identifier],
    );

    if (!result.rowCount) {
      return null;
    }

    return this.mapGuestAuth(result.rows[0]);
  }

  async listStaffRoleNames(tenantId: string, userId: string): Promise<string[]> {
    const result = await this.postgres.query<{ name: string }>(
      `SELECT r.name::text AS name
       FROM user_roles ur
       JOIN roles r
         ON r.id = ur.role_id
        AND r.tenant_id = ur.tenant_id
       WHERE ur.tenant_id = $1
         AND ur.user_id = $2
       ORDER BY r.name`,
      [tenantId, userId],
    );

    return result.rows.map((row) => row.name);
  }

  async listStaffPermissions(tenantId: string, userId: string): Promise<string[]> {
    const result = await this.postgres.query<{ code: string }>(
      `SELECT DISTINCT p.code::text AS code
       FROM user_roles ur
       JOIN roles r
         ON r.id = ur.role_id
        AND r.tenant_id = ur.tenant_id
       JOIN role_permissions rp
         ON rp.role_id = r.id
        AND rp.tenant_id = r.tenant_id
       JOIN permissions p
         ON p.id = rp.permission_id
       WHERE ur.tenant_id = $1
         AND ur.user_id = $2`,
      [tenantId, userId],
    );

    return result.rows.map((row) => row.code);
  }

  async listStaffPropertyAccess(
    tenantId: string,
    userId: string,
  ): Promise<StaffPropertyAccessRecord[]> {
    const result = await this.postgres.query<{
      property_id: string;
      access_level: string;
    }>(
      `SELECT property_id::text, access_level::text
       FROM user_property_access
       WHERE tenant_id = $1
         AND user_id = $2
       ORDER BY property_id`,
      [tenantId, userId],
    );

    return result.rows.map((row) => ({
      propertyId: row.property_id,
      accessLevel: row.access_level,
    }));
  }

  async hasPropertyAccess(tenantId: string, userId: string, propertyId: string): Promise<boolean> {
    const result = await this.postgres.query(
      `SELECT 1
       FROM user_property_access
       WHERE tenant_id = $1
         AND user_id = $2
         AND property_id = $3
       LIMIT 1`,
      [tenantId, userId, propertyId],
    );

    return Boolean(result.rowCount);
  }

  private mapStaffIdentity(row: {
    id: string;
    tenant_id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    email_normalized: string | null;
    phone_e164: string | null;
    password_hash: string | null;
    status: string;
    must_change_password: boolean;
    failed_login_attempts: number;
    locked_until: Date | null;
  }): StaffIdentityRecord {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      fullName: row.full_name,
      email: row.email ?? undefined,
      phone: row.phone ?? undefined,
      emailNormalized: row.email_normalized ?? undefined,
      phoneE164: row.phone_e164 ?? undefined,
      passwordHash: row.password_hash ?? undefined,
      status: row.status,
      mustChangePassword: row.must_change_password,
      failedLoginAttempts: Number(row.failed_login_attempts ?? 0),
      lockedUntil: row.locked_until ? row.locked_until.toISOString() : undefined,
    };
  }

  private mapGuestAuth(row: {
    id: string;
    full_name: string;
    email_normalized: string | null;
    phone_e164: string | null;
    password_hash: string;
    status: string;
  }): GuestAuthRecord {
    return {
      id: row.id,
      fullName: row.full_name,
      emailNormalized: row.email_normalized ?? undefined,
      phoneE164: row.phone_e164 ?? undefined,
      passwordHash: row.password_hash,
      status: row.status,
    };
  }
}
