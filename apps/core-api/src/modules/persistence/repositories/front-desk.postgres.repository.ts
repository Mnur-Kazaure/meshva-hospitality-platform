import { Injectable } from '@nestjs/common';
import {
  ApprovalEntityType,
  ApprovalStatus,
  DailyCloseStatus,
  DiscountType,
  OverrideType,
  PaymentMethod,
  PaymentStatus,
} from '@meshva/contracts';
import { randomUUID } from 'crypto';
import {
  AuditLogRecord,
  ConfirmationRecord,
  DailyCloseReportRecord,
  DayControlRecord,
  DiscountRequestRecord,
  FinanceShiftHandoverRecord,
  FolioLineItemRecord,
  GuestRecord,
  HousekeepingTaskRecord,
  MaintenanceTicketRecord,
  MenuCategoryRecord,
  MenuItemRecord,
  IdempotentResponse,
  IdempotencyKeyInput,
  InventoryBlockRecord,
  InventoryOverrideRecord,
  InvoiceRecord,
  OwnerExceptionRecord,
  OwnerExportJobRecord,
  OwnerNoteRecord,
  SubscriptionPlanRecord,
  TenantFeatureFlagRecord,
  TenantRecord,
  TenantSubscriptionRecord,
  UserRecord,
  OverrideRequestRecord,
  PaymentRecord,
  PropertyRecord,
  QueueJobRecord,
  RatePlanRecord,
  KitchenOrderRecord,
  KitchenOrderItemRecord,
  ReservationRecord,
  RefundRequestRecord,
  RefundExecutionRecord,
  RoomRecord,
  RoomTypeRecord,
  ShiftHandoverRecord,
  StayRecord,
  UserPropertyAccessRecord,
  ImpersonationSessionRecord,
} from '../../tenancy/tenancy-store.service';
import { PostgresService } from '../db/postgres.service';
import {
  CreateAuditLogInput,
  CreateConfirmationInput,
  CreateDailyCloseReportInput,
  CreateDiscountRequestInput,
  CreateFinanceShiftHandoverInput,
  CreateFolioLineItemInput,
  CreateGuestInput,
  CreateHousekeepingTaskInput,
  CreateInventoryBlockInput,
  CreateInventoryOverrideInput,
  CreateInvoiceInput,
  CreateKitchenOrderInput,
  CreateMenuCategoryInput,
  CreateMenuItemInput,
  CreateMaintenanceTicketInput,
  CreateOwnerExceptionInput,
  CreateOwnerExportJobInput,
  CreateOwnerNoteInput,
  CreatePropertyInput,
  CreateSubscriptionPlanInput,
  CreateTenantFeatureFlagInput,
  CreateTenantInput,
  CreateTenantSubscriptionInput,
  CreateUserInput,
  CreateUserPropertyAccessInput,
  CreateImpersonationSessionInput,
  CreateOverrideRequestInput,
  CreatePaymentInput,
  CreateRatePlanInput,
  CreateReservationInput,
  CreateRefundExecutionInput,
  CreateRefundRequestInput,
  CreateShiftHandoverInput,
  CreateStayInput,
  FrontDeskRepository,
  GuestLookupQuery,
  ReservationLookupQuery,
  RoomLookupQuery,
  StayLookupQuery,
  UpdateDiscountRequestInput,
  UpdateDailyCloseReportInput,
  UpdateGuestInput,
  UpdateInvoiceInput,
  UpdateKitchenOrderInput,
  UpdateMenuCategoryInput,
  UpdateMenuItemInput,
  UpdateMaintenanceTicketInput,
  UpdateOwnerExceptionInput,
  UpdateOwnerExportJobInput,
  UpdateSubscriptionPlanInput,
  UpdateTenantFeatureFlagInput,
  UpdateTenantInput,
  UpdateTenantSubscriptionInput,
  UpdateUserInput,
  UpdateImpersonationSessionInput,
  UpsertUserPropertyAccessInput,
  UpdateOverrideRequestInput,
  UpdatePaymentInput,
  UpdateRatePlanInput,
  UpdateReservationInput,
  UpdateRefundRequestInput,
  UpdateHousekeepingTaskInput,
  UpdateStayInput,
  UpsertDayControlInput,
} from './front-desk.repository';

@Injectable()
export class FrontDeskPostgresRepository implements FrontDeskRepository {
  constructor(private readonly postgres: PostgresService) {}

  async getTenant(tenantId: string): Promise<TenantRecord | undefined> {
    const result = await this.postgres.query(
      `SELECT id, name, legal_name, primary_phone, primary_email, country, state, city,
              timezone, status, created_at, updated_at
       FROM tenants
       WHERE id = $1
       LIMIT 1`,
      [tenantId],
    );

    if (!result.rowCount) {
      return undefined;
    }

    return this.mapTenant(result.rows[0]);
  }

  async listTenants(query?: { status?: string }): Promise<TenantRecord[]> {
    const params: unknown[] = [];
    let whereClause = '1=1';

    if (query?.status) {
      params.push(query.status);
      whereClause += ` AND status = $${params.length}`;
    }

    const result = await this.postgres.query(
      `SELECT id, name, legal_name, primary_phone, primary_email, country, state, city,
              timezone, status, created_at, updated_at
       FROM tenants
       WHERE ${whereClause}
       ORDER BY name`,
      params,
    );

    return result.rows.map((row) => this.mapTenant(row));
  }

  async createTenant(input: CreateTenantInput): Promise<TenantRecord> {
    const tenant = input.tenant;
    const result = await this.postgres.query(
      `INSERT INTO tenants (
          id, name, legal_name, primary_phone, primary_email, country, state, city, timezone, status
        )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, name, legal_name, primary_phone, primary_email, country, state, city,
                 timezone, status, created_at, updated_at`,
      [
        tenant.id,
        tenant.name,
        tenant.legalName ?? null,
        tenant.primaryPhone ?? null,
        tenant.primaryEmail ?? null,
        tenant.country ?? 'NG',
        tenant.state ?? null,
        tenant.city ?? null,
        tenant.timezone,
        tenant.status,
      ],
    );

    return this.mapTenant(result.rows[0]);
  }

  async updateTenant(input: UpdateTenantInput): Promise<TenantRecord> {
    const tenant = input.tenant;
    const result = await this.postgres.query(
      `UPDATE tenants
       SET name = $1,
           legal_name = $2,
           primary_phone = $3,
           primary_email = $4,
           country = $5,
           state = $6,
           city = $7,
           timezone = $8,
           status = $9,
           updated_at = NOW()
       WHERE id = $10
       RETURNING id, name, legal_name, primary_phone, primary_email, country, state, city,
                 timezone, status, created_at, updated_at`,
      [
        tenant.name,
        tenant.legalName ?? null,
        tenant.primaryPhone ?? null,
        tenant.primaryEmail ?? null,
        tenant.country ?? 'NG',
        tenant.state ?? null,
        tenant.city ?? null,
        tenant.timezone,
        tenant.status,
        tenant.id,
      ],
    );

    return this.mapTenant(result.rows[0]);
  }

  async isPropertyInTenant(tenantId: string, propertyId: string): Promise<boolean> {
    const result = await this.postgres.query(
      'SELECT 1 FROM properties WHERE id = $1 AND tenant_id = $2 LIMIT 1',
      [propertyId, tenantId],
    );

    return Boolean(result.rowCount);
  }

  async createProperty(input: CreatePropertyInput): Promise<PropertyRecord> {
    const property = input.property;
    const result = await this.postgres.query(
      `INSERT INTO properties (
          id, tenant_id, name, state, city, status
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, tenant_id, name, state, city, status`,
      [
        property.id,
        property.tenantId,
        property.name,
        property.state,
        property.city,
        property.status,
      ],
    );

    return {
      id: result.rows[0].id,
      tenantId: result.rows[0].tenant_id,
      name: result.rows[0].name,
      state: result.rows[0].state,
      city: result.rows[0].city,
      status: result.rows[0].status,
    };
  }

  async getProperty(tenantId: string, propertyId: string): Promise<PropertyRecord | undefined> {
    const result = await this.postgres.query(
      `SELECT id, tenant_id, name, state, city, status
       FROM properties
       WHERE id = $1 AND tenant_id = $2
       LIMIT 1`,
      [propertyId, tenantId],
    );

    if (!result.rowCount) {
      return undefined;
    }

    return {
      id: result.rows[0].id,
      tenantId: result.rows[0].tenant_id,
      name: result.rows[0].name,
      state: result.rows[0].state,
      city: result.rows[0].city,
      status: result.rows[0].status,
    };
  }

  async listPropertiesByTenant(tenantId: string): Promise<PropertyRecord[]> {
    const result = await this.postgres.query(
      `SELECT id, tenant_id, name, state, city, status
       FROM properties
       WHERE tenant_id = $1
       ORDER BY name`,
      [tenantId],
    );

    return result.rows.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      state: row.state,
      city: row.city,
      status: row.status,
    }));
  }

  async listUserPropertyAccess(query: {
    tenantId: string;
    userId: string;
  }): Promise<UserPropertyAccessRecord[]> {
    const result = await this.postgres.query(
      `SELECT id, tenant_id, user_id, property_id, access_level, created_at, updated_at
       FROM user_property_access
       WHERE tenant_id = $1 AND user_id = $2
       ORDER BY created_at DESC`,
      [query.tenantId, query.userId],
    );

    return result.rows.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      userId: row.user_id,
      propertyId: row.property_id,
      accessLevel: row.access_level,
      createdAt: this.toIso(row.created_at),
      updatedAt: this.toIso(row.updated_at),
    }));
  }

  async createUser(input: CreateUserInput): Promise<UserRecord> {
    const user = input.user;
    const result = await this.postgres.query(
      `INSERT INTO users (
          id, tenant_id, full_name, phone, email, password_hash, auth_provider,
          status, last_login_at, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11
        )
        RETURNING id, tenant_id, full_name, phone, email, password_hash, auth_provider,
                  status, last_login_at, created_at, updated_at`,
      [
        user.id,
        user.tenantId,
        user.fullName,
        user.phone ?? null,
        user.email ?? null,
        user.passwordHash ?? null,
        user.authProvider,
        user.status,
        user.lastLoginAt ?? null,
        user.createdAt,
        user.updatedAt,
      ],
    );

    return this.mapUser(result.rows[0]);
  }

  async updateUser(input: UpdateUserInput): Promise<UserRecord> {
    const user = input.user;
    const result = await this.postgres.query(
      `UPDATE users
       SET full_name = $1,
           phone = $2,
           email = $3,
           password_hash = $4,
           auth_provider = $5,
           status = $6,
           last_login_at = $7,
           updated_at = $8
       WHERE id = $9 AND tenant_id = $10
       RETURNING id, tenant_id, full_name, phone, email, password_hash, auth_provider,
                 status, last_login_at, created_at, updated_at`,
      [
        user.fullName,
        user.phone ?? null,
        user.email ?? null,
        user.passwordHash ?? null,
        user.authProvider,
        user.status,
        user.lastLoginAt ?? null,
        user.updatedAt,
        user.id,
        user.tenantId,
      ],
    );

    return this.mapUser(result.rows[0]);
  }

  async getUserById(query: {
    tenantId: string;
    userId: string;
  }): Promise<UserRecord | undefined> {
    const result = await this.postgres.query(
      `SELECT id, tenant_id, full_name, phone, email, password_hash, auth_provider, status,
              last_login_at, created_at, updated_at
       FROM users
       WHERE id = $1 AND tenant_id = $2
       LIMIT 1`,
      [query.userId, query.tenantId],
    );

    if (!result.rowCount) {
      return undefined;
    }

    return this.mapUser(result.rows[0]);
  }

  async getUserByIdGlobal(userId: string): Promise<UserRecord | undefined> {
    const result = await this.postgres.query(
      `SELECT id, tenant_id, full_name, phone, email, password_hash, auth_provider, status,
              last_login_at, created_at, updated_at
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [userId],
    );

    if (!result.rowCount) {
      return undefined;
    }

    return this.mapUser(result.rows[0]);
  }

  async listUsersByTenant(query: {
    tenantId: string;
    status?: string;
  }): Promise<UserRecord[]> {
    const params: unknown[] = [query.tenantId];
    let whereClause = 'tenant_id = $1';

    if (query.status) {
      params.push(query.status);
      whereClause += ` AND status = $${params.length}`;
    }

    const result = await this.postgres.query(
      `SELECT id, tenant_id, full_name, phone, email, password_hash, auth_provider, status,
              last_login_at, created_at, updated_at
       FROM users
       WHERE ${whereClause}
       ORDER BY created_at DESC`,
      params,
    );

    return result.rows.map((row) => this.mapUser(row));
  }

  async createUserPropertyAccess(
    input: CreateUserPropertyAccessInput,
  ): Promise<UserPropertyAccessRecord> {
    const access = input.access;
    const result = await this.postgres.query(
      `INSERT INTO user_property_access (
          id, tenant_id, user_id, property_id, access_level, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, tenant_id, user_id, property_id, access_level, created_at, updated_at`,
      [
        access.id,
        access.tenantId,
        access.userId,
        access.propertyId,
        access.accessLevel,
        access.createdAt,
        access.updatedAt,
      ],
    );

    return this.mapUserPropertyAccess(result.rows[0]);
  }

  async upsertUserPropertyAccess(
    input: UpsertUserPropertyAccessInput,
  ): Promise<UserPropertyAccessRecord> {
    const access = input.access;
    const result = await this.postgres.query(
      `INSERT INTO user_property_access (
          id, tenant_id, user_id, property_id, access_level, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (user_id, property_id)
        DO UPDATE SET
          access_level = EXCLUDED.access_level,
          updated_at = EXCLUDED.updated_at
        RETURNING id, tenant_id, user_id, property_id, access_level, created_at, updated_at`,
      [
        access.id,
        access.tenantId,
        access.userId,
        access.propertyId,
        access.accessLevel,
        access.createdAt,
        access.updatedAt,
      ],
    );

    return this.mapUserPropertyAccess(result.rows[0]);
  }

  async listSubscriptionPlans(query?: {
    isActive?: boolean;
  }): Promise<SubscriptionPlanRecord[]> {
    const params: unknown[] = [];
    let whereClause = '1=1';

    if (query?.isActive != null) {
      params.push(query.isActive);
      whereClause += ` AND is_active = $${params.length}`;
    }

    const result = await this.postgres.query(
      `SELECT id, code, name, description, property_limit, user_limit, features_json,
              is_active, created_at, updated_at
       FROM subscription_plans
       WHERE ${whereClause}
       ORDER BY name`,
      params,
    );

    return result.rows.map((row) => this.mapSubscriptionPlan(row));
  }

  async getSubscriptionPlanById(planId: string): Promise<SubscriptionPlanRecord | undefined> {
    const result = await this.postgres.query(
      `SELECT id, code, name, description, property_limit, user_limit, features_json,
              is_active, created_at, updated_at
       FROM subscription_plans
       WHERE id = $1
       LIMIT 1`,
      [planId],
    );

    if (!result.rowCount) {
      return undefined;
    }

    return this.mapSubscriptionPlan(result.rows[0]);
  }

  async createSubscriptionPlan(input: CreateSubscriptionPlanInput): Promise<SubscriptionPlanRecord> {
    const plan = input.plan;
    const result = await this.postgres.query(
      `INSERT INTO subscription_plans (
          id, code, name, description, property_limit, user_limit, features_json,
          is_active, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7::jsonb,
          $8, $9, $10
        )
        RETURNING id, code, name, description, property_limit, user_limit, features_json,
                  is_active, created_at, updated_at`,
      [
        plan.id,
        plan.code,
        plan.name,
        plan.description ?? null,
        plan.propertyLimit,
        plan.userLimit,
        JSON.stringify(plan.featuresJson ?? {}),
        plan.isActive,
        plan.createdAt,
        plan.updatedAt,
      ],
    );

    return this.mapSubscriptionPlan(result.rows[0]);
  }

  async updateSubscriptionPlan(input: UpdateSubscriptionPlanInput): Promise<SubscriptionPlanRecord> {
    const plan = input.plan;
    const result = await this.postgres.query(
      `UPDATE subscription_plans
       SET code = $1,
           name = $2,
           description = $3,
           property_limit = $4,
           user_limit = $5,
           features_json = $6::jsonb,
           is_active = $7,
           updated_at = $8
       WHERE id = $9
       RETURNING id, code, name, description, property_limit, user_limit, features_json,
                 is_active, created_at, updated_at`,
      [
        plan.code,
        plan.name,
        plan.description ?? null,
        plan.propertyLimit,
        plan.userLimit,
        JSON.stringify(plan.featuresJson ?? {}),
        plan.isActive,
        plan.updatedAt,
        plan.id,
      ],
    );

    return this.mapSubscriptionPlan(result.rows[0]);
  }

  async createTenantSubscription(
    input: CreateTenantSubscriptionInput,
  ): Promise<TenantSubscriptionRecord> {
    const subscription = input.subscription;
    const result = await this.postgres.query(
      `INSERT INTO tenant_subscriptions (
          id, tenant_id, subscription_plan_id, effective_from, effective_to,
          status, created_by_user_id, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9
        )
        RETURNING id, tenant_id, subscription_plan_id, effective_from, effective_to,
                  status, created_by_user_id, created_at, updated_at`,
      [
        subscription.id,
        subscription.tenantId,
        subscription.subscriptionPlanId,
        subscription.effectiveFrom,
        subscription.effectiveTo ?? null,
        subscription.status,
        subscription.createdByUserId,
        subscription.createdAt,
        subscription.updatedAt,
      ],
    );

    return this.mapTenantSubscription(result.rows[0]);
  }

  async updateTenantSubscription(
    input: UpdateTenantSubscriptionInput,
  ): Promise<TenantSubscriptionRecord> {
    const subscription = input.subscription;
    const result = await this.postgres.query(
      `UPDATE tenant_subscriptions
       SET subscription_plan_id = $1,
           effective_from = $2,
           effective_to = $3,
           status = $4,
           created_by_user_id = $5,
           updated_at = $6
       WHERE id = $7 AND tenant_id = $8
       RETURNING id, tenant_id, subscription_plan_id, effective_from, effective_to,
                 status, created_by_user_id, created_at, updated_at`,
      [
        subscription.subscriptionPlanId,
        subscription.effectiveFrom,
        subscription.effectiveTo ?? null,
        subscription.status,
        subscription.createdByUserId,
        subscription.updatedAt,
        subscription.id,
        subscription.tenantId,
      ],
    );

    return this.mapTenantSubscription(result.rows[0]);
  }

  async getActiveTenantSubscription(
    tenantId: string,
  ): Promise<TenantSubscriptionRecord | undefined> {
    const result = await this.postgres.query(
      `SELECT id, tenant_id, subscription_plan_id, effective_from, effective_to,
              status, created_by_user_id, created_at, updated_at
       FROM tenant_subscriptions
       WHERE tenant_id = $1 AND status = 'ACTIVE'
       ORDER BY effective_from DESC, created_at DESC
       LIMIT 1`,
      [tenantId],
    );

    if (!result.rowCount) {
      return undefined;
    }

    return this.mapTenantSubscription(result.rows[0]);
  }

  async listTenantSubscriptions(tenantId: string): Promise<TenantSubscriptionRecord[]> {
    const result = await this.postgres.query(
      `SELECT id, tenant_id, subscription_plan_id, effective_from, effective_to,
              status, created_by_user_id, created_at, updated_at
       FROM tenant_subscriptions
       WHERE tenant_id = $1
       ORDER BY created_at DESC`,
      [tenantId],
    );

    return result.rows.map((row) => this.mapTenantSubscription(row));
  }

  async listTenantFeatureFlags(tenantId: string): Promise<TenantFeatureFlagRecord[]> {
    const result = await this.postgres.query(
      `SELECT id, tenant_id, key, enabled, config_json, updated_by_user_id, created_at, updated_at
       FROM tenant_feature_flags
       WHERE tenant_id = $1
       ORDER BY key`,
      [tenantId],
    );

    return result.rows.map((row) => this.mapTenantFeatureFlag(row));
  }

  async getTenantFeatureFlag(query: {
    tenantId: string;
    key: string;
  }): Promise<TenantFeatureFlagRecord | undefined> {
    const result = await this.postgres.query(
      `SELECT id, tenant_id, key, enabled, config_json, updated_by_user_id, created_at, updated_at
       FROM tenant_feature_flags
       WHERE tenant_id = $1 AND key = $2
       LIMIT 1`,
      [query.tenantId, query.key],
    );

    if (!result.rowCount) {
      return undefined;
    }

    return this.mapTenantFeatureFlag(result.rows[0]);
  }

  async createTenantFeatureFlag(
    input: CreateTenantFeatureFlagInput,
  ): Promise<TenantFeatureFlagRecord> {
    const featureFlag = input.featureFlag;
    const result = await this.postgres.query(
      `INSERT INTO tenant_feature_flags (
          id, tenant_id, key, enabled, config_json, updated_by_user_id, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5::jsonb, $6, $7, $8
        )
        RETURNING id, tenant_id, key, enabled, config_json, updated_by_user_id, created_at, updated_at`,
      [
        featureFlag.id,
        featureFlag.tenantId,
        featureFlag.key,
        featureFlag.enabled,
        JSON.stringify(featureFlag.configJson ?? {}),
        featureFlag.updatedByUserId,
        featureFlag.createdAt,
        featureFlag.updatedAt,
      ],
    );

    return this.mapTenantFeatureFlag(result.rows[0]);
  }

  async updateTenantFeatureFlag(
    input: UpdateTenantFeatureFlagInput,
  ): Promise<TenantFeatureFlagRecord> {
    const featureFlag = input.featureFlag;
    const result = await this.postgres.query(
      `UPDATE tenant_feature_flags
       SET enabled = $1,
           config_json = $2::jsonb,
           updated_by_user_id = $3,
           updated_at = $4
       WHERE id = $5 AND tenant_id = $6
       RETURNING id, tenant_id, key, enabled, config_json, updated_by_user_id, created_at, updated_at`,
      [
        featureFlag.enabled,
        JSON.stringify(featureFlag.configJson ?? {}),
        featureFlag.updatedByUserId,
        featureFlag.updatedAt,
        featureFlag.id,
        featureFlag.tenantId,
      ],
    );

    return this.mapTenantFeatureFlag(result.rows[0]);
  }

  async createImpersonationSession(
    input: CreateImpersonationSessionInput,
  ): Promise<ImpersonationSessionRecord> {
    const session = input.session;
    const result = await this.postgres.query(
      `INSERT INTO impersonation_sessions (
          id, tenant_id, target_user_id, token, status, started_by_user_id, started_at,
          expires_at, ended_at, ended_by_user_id, reason
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11
        )
        RETURNING id, tenant_id, target_user_id, token, status, started_by_user_id, started_at,
                  expires_at, ended_at, ended_by_user_id, reason`,
      [
        session.id,
        session.tenantId,
        session.targetUserId,
        session.token,
        session.status,
        session.startedByUserId,
        session.startedAt,
        session.expiresAt,
        session.endedAt ?? null,
        session.endedByUserId ?? null,
        session.reason ?? null,
      ],
    );

    return this.mapImpersonationSession(result.rows[0]);
  }

  async updateImpersonationSession(
    input: UpdateImpersonationSessionInput,
  ): Promise<ImpersonationSessionRecord> {
    const session = input.session;
    const result = await this.postgres.query(
      `UPDATE impersonation_sessions
       SET status = $1,
           expires_at = $2,
           ended_at = $3,
           ended_by_user_id = $4,
           reason = $5
       WHERE id = $6
       RETURNING id, tenant_id, target_user_id, token, status, started_by_user_id, started_at,
                 expires_at, ended_at, ended_by_user_id, reason`,
      [
        session.status,
        session.expiresAt,
        session.endedAt ?? null,
        session.endedByUserId ?? null,
        session.reason ?? null,
        session.id,
      ],
    );

    return this.mapImpersonationSession(result.rows[0]);
  }

  async getImpersonationSessionById(
    sessionId: string,
  ): Promise<ImpersonationSessionRecord | undefined> {
    const result = await this.postgres.query(
      `SELECT id, tenant_id, target_user_id, token, status, started_by_user_id, started_at,
              expires_at, ended_at, ended_by_user_id, reason
       FROM impersonation_sessions
       WHERE id = $1
       LIMIT 1`,
      [sessionId],
    );

    if (!result.rowCount) {
      return undefined;
    }

    return this.mapImpersonationSession(result.rows[0]);
  }

  async listImpersonationSessions(query: {
    tenantId?: string;
    targetUserId?: string;
    status?: string;
    limit?: number;
  }): Promise<ImpersonationSessionRecord[]> {
    const params: unknown[] = [];
    let whereClause = '1=1';

    if (query.tenantId) {
      params.push(query.tenantId);
      whereClause += ` AND tenant_id = $${params.length}`;
    }

    if (query.targetUserId) {
      params.push(query.targetUserId);
      whereClause += ` AND target_user_id = $${params.length}`;
    }

    if (query.status) {
      params.push(query.status);
      whereClause += ` AND status = $${params.length}`;
    }

    params.push(query.limit ?? 100);
    const result = await this.postgres.query(
      `SELECT id, tenant_id, target_user_id, token, status, started_by_user_id, started_at,
              expires_at, ended_at, ended_by_user_id, reason
       FROM impersonation_sessions
       WHERE ${whereClause}
       ORDER BY started_at DESC
       LIMIT $${params.length}`,
      params,
    );

    return result.rows.map((row) => this.mapImpersonationSession(row));
  }

  async searchGuests(query: GuestLookupQuery & { search?: string }): Promise<GuestRecord[]> {
    const params: unknown[] = [query.tenantId, query.propertyId];
    let whereClause = 'tenant_id = $1 AND property_id = $2';

    if (query.search?.trim()) {
      params.push(`%${query.search.trim()}%`);
      whereClause +=
        " AND (full_name ILIKE $3 OR COALESCE(phone, '') ILIKE $3 OR COALESCE(email, '') ILIKE $3)";
    }

    const result = await this.postgres.query(
      `SELECT id, tenant_id, property_id, full_name, phone, email, notes, created_at, updated_at
       FROM guests
       WHERE ${whereClause}
       ORDER BY created_at DESC`,
      params,
    );

    return result.rows.map((row) => this.mapGuest(row));
  }

  async getGuestById(query: GuestLookupQuery & { guestId: string }): Promise<GuestRecord | undefined> {
    const result = await this.postgres.query(
      `SELECT id, tenant_id, property_id, full_name, phone, email, notes, created_at, updated_at
       FROM guests
       WHERE id = $1 AND tenant_id = $2 AND property_id = $3
       LIMIT 1`,
      [query.guestId, query.tenantId, query.propertyId],
    );

    if (!result.rowCount) {
      return undefined;
    }

    return this.mapGuest(result.rows[0]);
  }

  async createGuest(input: CreateGuestInput): Promise<GuestRecord> {
    const id = randomUUID();
    const result = await this.postgres.query(
      `INSERT INTO guests (id, tenant_id, property_id, full_name, phone, email, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, tenant_id, property_id, full_name, phone, email, notes, created_at, updated_at`,
      [
        id,
        input.tenantId,
        input.propertyId,
        input.fullName,
        input.phone ?? null,
        input.email ?? null,
        input.notes ?? null,
      ],
    );

    return this.mapGuest(result.rows[0]);
  }

  async updateGuest(
    query: GuestLookupQuery & { guestId: string; patch: UpdateGuestInput },
  ): Promise<GuestRecord | undefined> {
    const current = await this.getGuestById(query);
    if (!current) {
      return undefined;
    }

    const result = await this.postgres.query(
      `UPDATE guests
       SET
         full_name = $1,
         phone = $2,
         email = $3,
         notes = $4,
         updated_at = NOW()
       WHERE id = $5 AND tenant_id = $6 AND property_id = $7
       RETURNING id, tenant_id, property_id, full_name, phone, email, notes, created_at, updated_at`,
      [
        query.patch.fullName ?? current.fullName,
        query.patch.phone ?? current.phone ?? null,
        query.patch.email ?? current.email ?? null,
        query.patch.notes ?? current.notes ?? null,
        query.guestId,
        query.tenantId,
        query.propertyId,
      ],
    );

    return !result.rowCount ? undefined : this.mapGuest(result.rows[0]);
  }

  async listRoomTypes(query: RoomLookupQuery): Promise<RoomTypeRecord[]> {
    const result = await this.postgres.query(
      `SELECT id, tenant_id, property_id, name, total_units
       FROM room_types
       WHERE tenant_id = $1 AND property_id = $2
       ORDER BY name`,
      [query.tenantId, query.propertyId],
    );

    return result.rows.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      propertyId: row.property_id,
      name: row.name,
      totalUnits: Number(row.total_units),
    }));
  }

  async getRoomType(
    query: RoomLookupQuery & { roomTypeId: string },
  ): Promise<RoomTypeRecord | undefined> {
    const result = await this.postgres.query(
      `SELECT id, tenant_id, property_id, name, total_units
       FROM room_types
       WHERE id = $1 AND tenant_id = $2 AND property_id = $3
       LIMIT 1`,
      [query.roomTypeId, query.tenantId, query.propertyId],
    );

    if (!result.rowCount) {
      return undefined;
    }

    return {
      id: result.rows[0].id,
      tenantId: result.rows[0].tenant_id,
      propertyId: result.rows[0].property_id,
      name: result.rows[0].name,
      totalUnits: Number(result.rows[0].total_units),
    };
  }

  async listRooms(query: RoomLookupQuery): Promise<RoomRecord[]> {
    const result = await this.postgres.query(
      `SELECT id, tenant_id, property_id, room_type_id, room_number, status
       FROM rooms
       WHERE tenant_id = $1 AND property_id = $2
       ORDER BY room_number`,
      [query.tenantId, query.propertyId],
    );

    return result.rows.map((row) => this.mapRoom(row));
  }

  async getRoom(query: RoomLookupQuery & { roomId: string }): Promise<RoomRecord | undefined> {
    const result = await this.postgres.query(
      `SELECT id, tenant_id, property_id, room_type_id, room_number, status
       FROM rooms
       WHERE id = $1 AND tenant_id = $2 AND property_id = $3
       LIMIT 1`,
      [query.roomId, query.tenantId, query.propertyId],
    );

    if (!result.rowCount) {
      return undefined;
    }

    return this.mapRoom(result.rows[0]);
  }

  async updateRoom(room: RoomRecord): Promise<RoomRecord> {
    const result = await this.postgres.query(
      `UPDATE rooms
       SET status = $1, updated_at = NOW()
       WHERE id = $2 AND tenant_id = $3 AND property_id = $4
       RETURNING id, tenant_id, property_id, room_type_id, room_number, status`,
      [room.status, room.id, room.tenantId, room.propertyId],
    );

    return this.mapRoom(result.rows[0]);
  }

  async listRatePlans(query: RoomLookupQuery): Promise<RatePlanRecord[]> {
    const result = await this.postgres.query(
      `SELECT id, tenant_id, property_id, room_type_id, name, base_rate, currency,
              effective_from, effective_to, created_at, updated_at
       FROM rate_plans
       WHERE tenant_id = $1 AND property_id = $2
       ORDER BY name`,
      [query.tenantId, query.propertyId],
    );

    return result.rows.map((row) => this.mapRatePlan(row));
  }

  async getRatePlan(
    query: RoomLookupQuery & { ratePlanId: string },
  ): Promise<RatePlanRecord | undefined> {
    const result = await this.postgres.query(
      `SELECT id, tenant_id, property_id, room_type_id, name, base_rate, currency,
              effective_from, effective_to, created_at, updated_at
       FROM rate_plans
       WHERE id = $1 AND tenant_id = $2 AND property_id = $3
       LIMIT 1`,
      [query.ratePlanId, query.tenantId, query.propertyId],
    );

    if (!result.rowCount) {
      return undefined;
    }

    return this.mapRatePlan(result.rows[0]);
  }

  async createRatePlan(input: CreateRatePlanInput): Promise<RatePlanRecord> {
    const ratePlan = input.ratePlan;
    const result = await this.postgres.query(
      `INSERT INTO rate_plans (
          id, tenant_id, property_id, room_type_id, name, base_rate, currency,
          effective_from, effective_to, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11
        )
        RETURNING id, tenant_id, property_id, room_type_id, name, base_rate, currency,
                  effective_from, effective_to, created_at, updated_at`,
      [
        ratePlan.id,
        ratePlan.tenantId,
        ratePlan.propertyId,
        ratePlan.roomTypeId,
        ratePlan.name,
        ratePlan.baseRate,
        ratePlan.currency,
        ratePlan.effectiveFrom,
        ratePlan.effectiveTo ?? null,
        ratePlan.createdAt,
        ratePlan.updatedAt,
      ],
    );

    return this.mapRatePlan(result.rows[0]);
  }

  async updateRatePlan(input: UpdateRatePlanInput): Promise<RatePlanRecord> {
    const ratePlan = input.ratePlan;
    const result = await this.postgres.query(
      `UPDATE rate_plans
       SET room_type_id = $1,
           name = $2,
           base_rate = $3,
           currency = $4,
           effective_from = $5,
           effective_to = $6,
           updated_at = $7
       WHERE id = $8 AND tenant_id = $9 AND property_id = $10
       RETURNING id, tenant_id, property_id, room_type_id, name, base_rate, currency,
                 effective_from, effective_to, created_at, updated_at`,
      [
        ratePlan.roomTypeId,
        ratePlan.name,
        ratePlan.baseRate,
        ratePlan.currency,
        ratePlan.effectiveFrom,
        ratePlan.effectiveTo ?? null,
        ratePlan.updatedAt,
        ratePlan.id,
        ratePlan.tenantId,
        ratePlan.propertyId,
      ],
    );

    return this.mapRatePlan(result.rows[0]);
  }

  async listMenuCategories(query: RoomLookupQuery): Promise<MenuCategoryRecord[]> {
    const result = await this.postgres.query(
      `SELECT id, tenant_id, property_id, name, created_by_user_id, updated_by_user_id,
              created_at, updated_at
       FROM menu_categories
       WHERE tenant_id = $1 AND property_id = $2
       ORDER BY name`,
      [query.tenantId, query.propertyId],
    );

    return result.rows.map((row) => this.mapMenuCategory(row));
  }

  async getMenuCategory(
    query: RoomLookupQuery & { categoryId: string },
  ): Promise<MenuCategoryRecord | undefined> {
    const result = await this.postgres.query(
      `SELECT id, tenant_id, property_id, name, created_by_user_id, updated_by_user_id,
              created_at, updated_at
       FROM menu_categories
       WHERE id = $1 AND tenant_id = $2 AND property_id = $3
       LIMIT 1`,
      [query.categoryId, query.tenantId, query.propertyId],
    );

    if (!result.rowCount) {
      return undefined;
    }

    return this.mapMenuCategory(result.rows[0]);
  }

  async createMenuCategory(input: CreateMenuCategoryInput): Promise<MenuCategoryRecord> {
    const category = input.category;
    const result = await this.postgres.query(
      `INSERT INTO menu_categories (
          id, tenant_id, property_id, name, created_by_user_id, updated_by_user_id,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8
        )
        RETURNING id, tenant_id, property_id, name, created_by_user_id, updated_by_user_id,
                  created_at, updated_at`,
      [
        category.id,
        category.tenantId,
        category.propertyId,
        category.name,
        category.createdByUserId,
        category.updatedByUserId ?? null,
        category.createdAt,
        category.updatedAt,
      ],
    );

    return this.mapMenuCategory(result.rows[0]);
  }

  async updateMenuCategory(input: UpdateMenuCategoryInput): Promise<MenuCategoryRecord> {
    const category = input.category;
    const result = await this.postgres.query(
      `UPDATE menu_categories
       SET name = $1,
           updated_by_user_id = $2,
           updated_at = $3
       WHERE id = $4 AND tenant_id = $5 AND property_id = $6
       RETURNING id, tenant_id, property_id, name, created_by_user_id, updated_by_user_id,
                 created_at, updated_at`,
      [
        category.name,
        category.updatedByUserId ?? null,
        category.updatedAt,
        category.id,
        category.tenantId,
        category.propertyId,
      ],
    );

    return this.mapMenuCategory(result.rows[0]);
  }

  async listMenuItems(query: RoomLookupQuery & { categoryId?: string }): Promise<MenuItemRecord[]> {
    const params: unknown[] = [query.tenantId, query.propertyId];
    let whereClause = 'tenant_id = $1 AND property_id = $2';

    if (query.categoryId) {
      params.push(query.categoryId);
      whereClause += ` AND category_id = $${params.length}`;
    }

    const result = await this.postgres.query(
      `SELECT id, tenant_id, property_id, category_id, name, price, active, description,
              created_by_user_id, updated_by_user_id, created_at, updated_at
       FROM menu_items
       WHERE ${whereClause}
       ORDER BY name`,
      params,
    );

    return result.rows.map((row) => this.mapMenuItem(row));
  }

  async getMenuItem(
    query: RoomLookupQuery & { itemId: string },
  ): Promise<MenuItemRecord | undefined> {
    const result = await this.postgres.query(
      `SELECT id, tenant_id, property_id, category_id, name, price, active, description,
              created_by_user_id, updated_by_user_id, created_at, updated_at
       FROM menu_items
       WHERE id = $1 AND tenant_id = $2 AND property_id = $3
       LIMIT 1`,
      [query.itemId, query.tenantId, query.propertyId],
    );

    if (!result.rowCount) {
      return undefined;
    }

    return this.mapMenuItem(result.rows[0]);
  }

  async createMenuItem(input: CreateMenuItemInput): Promise<MenuItemRecord> {
    const item = input.item;
    const result = await this.postgres.query(
      `INSERT INTO menu_items (
          id, tenant_id, property_id, category_id, name, price, active, description,
          created_by_user_id, updated_by_user_id, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12
        )
        RETURNING id, tenant_id, property_id, category_id, name, price, active, description,
                  created_by_user_id, updated_by_user_id, created_at, updated_at`,
      [
        item.id,
        item.tenantId,
        item.propertyId,
        item.categoryId,
        item.name,
        item.price,
        item.active,
        item.description ?? null,
        item.createdByUserId,
        item.updatedByUserId ?? null,
        item.createdAt,
        item.updatedAt,
      ],
    );

    return this.mapMenuItem(result.rows[0]);
  }

  async updateMenuItem(input: UpdateMenuItemInput): Promise<MenuItemRecord> {
    const item = input.item;
    const result = await this.postgres.query(
      `UPDATE menu_items
       SET category_id = $1,
           name = $2,
           price = $3,
           active = $4,
           description = $5,
           updated_by_user_id = $6,
           updated_at = $7
       WHERE id = $8 AND tenant_id = $9 AND property_id = $10
       RETURNING id, tenant_id, property_id, category_id, name, price, active, description,
                 created_by_user_id, updated_by_user_id, created_at, updated_at`,
      [
        item.categoryId,
        item.name,
        item.price,
        item.active,
        item.description ?? null,
        item.updatedByUserId ?? null,
        item.updatedAt,
        item.id,
        item.tenantId,
        item.propertyId,
      ],
    );

    return this.mapMenuItem(result.rows[0]);
  }

  async listKitchenOrders(query: {
    tenantId: string;
    propertyId: string;
    status?: string;
    from?: string;
    to?: string;
    search?: string;
  }): Promise<KitchenOrderRecord[]> {
    const params: unknown[] = [query.tenantId, query.propertyId];
    let whereClause = 'ko.tenant_id = $1 AND ko.property_id = $2';

    if (query.status) {
      params.push(query.status);
      whereClause += ` AND ko.status = $${params.length}`;
    }

    if (query.from) {
      params.push(query.from);
      whereClause += ` AND DATE(ko.created_at) >= $${params.length}`;
    }

    if (query.to) {
      params.push(query.to);
      whereClause += ` AND DATE(ko.created_at) <= $${params.length}`;
    }

    if (query.search?.trim()) {
      params.push(`%${query.search.trim()}%`);
      whereClause += ` AND (
        ko.code ILIKE $${params.length}
        OR COALESCE(ko.notes, '') ILIKE $${params.length}
        OR COALESCE(ko.cancelled_reason, '') ILIKE $${params.length}
        OR COALESCE(r.room_number, '') ILIKE $${params.length}
        OR COALESCE(g.full_name, '') ILIKE $${params.length}
      )`;
    }

    const result = await this.postgres.query(
      `SELECT ko.id, ko.tenant_id, ko.property_id, ko.code, ko.stay_id, ko.room_id,
              ko.status, ko.notes, ko.total_amount, ko.charge_posted_at,
              ko.charge_folio_line_item_id, ko.cancelled_reason, ko.created_by_user_id,
              ko.updated_by_user_id, ko.created_at, ko.updated_at
       FROM kitchen_orders ko
       LEFT JOIN rooms r
         ON r.id = ko.room_id AND r.tenant_id = ko.tenant_id AND r.property_id = ko.property_id
       LEFT JOIN stays s
         ON s.id = ko.stay_id AND s.tenant_id = ko.tenant_id AND s.property_id = ko.property_id
       LEFT JOIN guests g
         ON g.id = s.guest_id AND g.tenant_id = ko.tenant_id AND g.property_id = ko.property_id
       WHERE ${whereClause}
       ORDER BY ko.created_at DESC`,
      params,
    );

    return result.rows.map((row) => this.mapKitchenOrder(row));
  }

  async getKitchenOrder(query: {
    tenantId: string;
    propertyId: string;
    orderId: string;
  }): Promise<KitchenOrderRecord | undefined> {
    const result = await this.postgres.query(
      `SELECT id, tenant_id, property_id, code, stay_id, room_id, status, notes, total_amount,
              charge_posted_at, charge_folio_line_item_id, cancelled_reason, created_by_user_id,
              updated_by_user_id, created_at, updated_at
       FROM kitchen_orders
       WHERE id = $1 AND tenant_id = $2 AND property_id = $3
       LIMIT 1`,
      [query.orderId, query.tenantId, query.propertyId],
    );

    if (!result.rowCount) {
      return undefined;
    }

    return this.mapKitchenOrder(result.rows[0]);
  }

  async createKitchenOrder(input: CreateKitchenOrderInput): Promise<KitchenOrderRecord> {
    const order = input.order;
    const result = await this.postgres.query(
      `INSERT INTO kitchen_orders (
          id, tenant_id, property_id, code, stay_id, room_id, status, notes, total_amount,
          charge_posted_at, charge_folio_line_item_id, cancelled_reason, created_by_user_id,
          updated_by_user_id, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9,
          $10, $11, $12, $13, $14, $15, $16
        )
        RETURNING id, tenant_id, property_id, code, stay_id, room_id, status, notes, total_amount,
                  charge_posted_at, charge_folio_line_item_id, cancelled_reason, created_by_user_id,
                  updated_by_user_id, created_at, updated_at`,
      [
        order.id,
        order.tenantId,
        order.propertyId,
        order.code,
        order.stayId,
        order.roomId,
        order.status,
        order.notes ?? null,
        order.totalAmount,
        order.chargePostedAt ?? null,
        order.chargeFolioLineItemId ?? null,
        order.cancelledReason ?? null,
        order.createdByUserId,
        order.updatedByUserId ?? null,
        order.createdAt,
        order.updatedAt,
      ],
    );

    return this.mapKitchenOrder(result.rows[0]);
  }

  async updateKitchenOrder(input: UpdateKitchenOrderInput): Promise<KitchenOrderRecord> {
    const order = input.order;
    const result = await this.postgres.query(
      `UPDATE kitchen_orders
       SET status = $1,
           notes = $2,
           total_amount = $3,
           charge_posted_at = $4,
           charge_folio_line_item_id = $5,
           cancelled_reason = $6,
           updated_by_user_id = $7,
           updated_at = $8
       WHERE id = $9 AND tenant_id = $10 AND property_id = $11
       RETURNING id, tenant_id, property_id, code, stay_id, room_id, status, notes, total_amount,
                 charge_posted_at, charge_folio_line_item_id, cancelled_reason, created_by_user_id,
                 updated_by_user_id, created_at, updated_at`,
      [
        order.status,
        order.notes ?? null,
        order.totalAmount,
        order.chargePostedAt ?? null,
        order.chargeFolioLineItemId ?? null,
        order.cancelledReason ?? null,
        order.updatedByUserId ?? null,
        order.updatedAt,
        order.id,
        order.tenantId,
        order.propertyId,
      ],
    );

    return this.mapKitchenOrder(result.rows[0]);
  }

  async listKitchenOrderItems(query: {
    tenantId: string;
    propertyId: string;
    orderId: string;
  }): Promise<KitchenOrderItemRecord[]> {
    const result = await this.postgres.query(
      `SELECT id, tenant_id, property_id, order_id, menu_item_id, menu_item_name, quantity,
              unit_price, line_total, item_note, created_at, updated_at
       FROM kitchen_order_items
       WHERE tenant_id = $1 AND property_id = $2 AND order_id = $3
       ORDER BY created_at DESC`,
      [query.tenantId, query.propertyId, query.orderId],
    );

    return result.rows.map((row) => this.mapKitchenOrderItem(row));
  }

  async createKitchenOrderItems(input: {
    tenantId: string;
    propertyId: string;
    items: KitchenOrderItemRecord[];
  }): Promise<KitchenOrderItemRecord[]> {
    const created: KitchenOrderItemRecord[] = [];
    for (const item of input.items) {
      const result = await this.postgres.query(
        `INSERT INTO kitchen_order_items (
            id, tenant_id, property_id, order_id, menu_item_id, menu_item_name, quantity,
            unit_price, line_total, item_note, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            $8, $9, $10, $11, $12
          )
          RETURNING id, tenant_id, property_id, order_id, menu_item_id, menu_item_name, quantity,
                    unit_price, line_total, item_note, created_at, updated_at`,
        [
          item.id,
          input.tenantId,
          input.propertyId,
          item.orderId,
          item.menuItemId,
          item.menuItemName,
          item.quantity,
          item.unitPrice,
          item.lineTotal,
          item.itemNote ?? null,
          item.createdAt,
          item.updatedAt,
        ],
      );
      created.push(this.mapKitchenOrderItem(result.rows[0]));
    }

    return created;
  }

  async deleteKitchenOrderItems(query: {
    tenantId: string;
    propertyId: string;
    orderId: string;
  }): Promise<void> {
    await this.postgres.query(
      `DELETE FROM kitchen_order_items
       WHERE tenant_id = $1 AND property_id = $2 AND order_id = $3`,
      [query.tenantId, query.propertyId, query.orderId],
    );
  }

  async generateKitchenOrderCode(propertyId: string): Promise<string> {
    const seq = await this.postgres.query<{ seq: string }>(
      `SELECT GREATEST(
          nextval('kitchen_order_code_seq')::bigint,
          COALESCE(
            (
              SELECT MAX((regexp_replace(code, '^K-', ''))::bigint) + 1
              FROM kitchen_orders
              WHERE property_id = $1
                AND code ~ '^K-[0-9]+$'
            ),
            1001
          )
        )::text AS seq`,
      [propertyId],
    );

    return `K-${seq.rows[0].seq}`;
  }

  async listInvoices(query: {
    tenantId: string;
    propertyId: string;
    search?: string;
    status?: string;
  }): Promise<InvoiceRecord[]> {
    const params: unknown[] = [query.tenantId, query.propertyId];
    let whereClause = 'tenant_id = $1 AND property_id = $2';

    if (query.status) {
      params.push(query.status);
      whereClause += ` AND status = $${params.length}`;
    }

    if (query.search?.trim()) {
      params.push(`%${query.search.trim()}%`);
      whereClause += ` AND (
        invoice_number ILIKE $${params.length}
        OR COALESCE(reservation_id::text, '') ILIKE $${params.length}
        OR COALESCE(stay_id::text, '') ILIKE $${params.length}
      )`;
    }

    const result = await this.postgres.query(
      `SELECT id, tenant_id, property_id, invoice_number, reservation_id, stay_id, guest_id,
              issued_on, currency, status, created_at, updated_at
       FROM invoices
       WHERE ${whereClause}
       ORDER BY created_at DESC`,
      params,
    );

    return result.rows.map((row) => this.mapInvoice(row));
  }

  async getInvoice(query: {
    tenantId: string;
    propertyId: string;
    invoiceId: string;
  }): Promise<InvoiceRecord | undefined> {
    const result = await this.postgres.query(
      `SELECT id, tenant_id, property_id, invoice_number, reservation_id, stay_id, guest_id,
              issued_on, currency, status, created_at, updated_at
       FROM invoices
       WHERE id = $1 AND tenant_id = $2 AND property_id = $3
       LIMIT 1`,
      [query.invoiceId, query.tenantId, query.propertyId],
    );

    if (!result.rowCount) {
      return undefined;
    }

    return this.mapInvoice(result.rows[0]);
  }

  async getOpenInvoiceByStay(query: {
    tenantId: string;
    propertyId: string;
    stayId: string;
  }): Promise<InvoiceRecord | undefined> {
    const result = await this.postgres.query(
      `SELECT id, tenant_id, property_id, invoice_number, reservation_id, stay_id, guest_id,
              issued_on, currency, status, created_at, updated_at
       FROM invoices
       WHERE tenant_id = $1
         AND property_id = $2
         AND stay_id = $3
         AND status = 'OPEN'
       ORDER BY created_at DESC
       LIMIT 1`,
      [query.tenantId, query.propertyId, query.stayId],
    );

    if (!result.rowCount) {
      return undefined;
    }

    return this.mapInvoice(result.rows[0]);
  }

  async createInvoice(input: CreateInvoiceInput): Promise<InvoiceRecord> {
    const invoice = input.invoice;
    const result = await this.postgres.query(
      `INSERT INTO invoices (
          id, tenant_id, property_id, invoice_number, reservation_id, stay_id, guest_id,
          issued_on, currency, status, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12
        )
        RETURNING id, tenant_id, property_id, invoice_number, reservation_id, stay_id, guest_id,
                  issued_on, currency, status, created_at, updated_at`,
      [
        invoice.id,
        invoice.tenantId,
        invoice.propertyId,
        invoice.invoiceNumber,
        invoice.reservationId ?? null,
        invoice.stayId ?? null,
        invoice.guestId ?? null,
        invoice.issuedOn,
        invoice.currency,
        invoice.status,
        invoice.createdAt,
        invoice.updatedAt,
      ],
    );

    return this.mapInvoice(result.rows[0]);
  }

  async updateInvoice(input: UpdateInvoiceInput): Promise<InvoiceRecord> {
    const invoice = input.invoice;
    const result = await this.postgres.query(
      `UPDATE invoices
       SET reservation_id = $1,
           stay_id = $2,
           guest_id = $3,
           issued_on = $4,
           currency = $5,
           status = $6,
           updated_at = $7
       WHERE id = $8 AND tenant_id = $9 AND property_id = $10
       RETURNING id, tenant_id, property_id, invoice_number, reservation_id, stay_id, guest_id,
                 issued_on, currency, status, created_at, updated_at`,
      [
        invoice.reservationId ?? null,
        invoice.stayId ?? null,
        invoice.guestId ?? null,
        invoice.issuedOn,
        invoice.currency,
        invoice.status,
        invoice.updatedAt,
        invoice.id,
        invoice.tenantId,
        invoice.propertyId,
      ],
    );

    return this.mapInvoice(result.rows[0]);
  }

  async listReservations(query: ReservationLookupQuery): Promise<ReservationRecord[]> {
    const result = await this.postgres.query(
      `SELECT id, tenant_id, property_id, code, guest_id, guest_full_name, guest_phone,
              room_type_id, check_in, check_out, adults, children, source, notes,
              no_phone, deposit_status, status, cancel_reason, cancel_notes, created_at, updated_at
       FROM reservations
       WHERE tenant_id = $1 AND property_id = $2
       ORDER BY created_at DESC`,
      [query.tenantId, query.propertyId],
    );

    return result.rows.map((row) => this.mapReservation(row));
  }

  async getReservation(
    query: ReservationLookupQuery & { reservationId: string },
  ): Promise<ReservationRecord | undefined> {
    const result = await this.postgres.query(
      `SELECT id, tenant_id, property_id, code, guest_id, guest_full_name, guest_phone,
              room_type_id, check_in, check_out, adults, children, source, notes,
              no_phone, deposit_status, status, cancel_reason, cancel_notes, created_at, updated_at
       FROM reservations
       WHERE id = $1 AND tenant_id = $2 AND property_id = $3
       LIMIT 1`,
      [query.reservationId, query.tenantId, query.propertyId],
    );

    if (!result.rowCount) {
      return undefined;
    }

    return this.mapReservation(result.rows[0]);
  }

  async createReservation(input: CreateReservationInput): Promise<ReservationRecord> {
    const reservation = input.reservation;

    const result = await this.postgres.query(
      `INSERT INTO reservations (
          id, tenant_id, property_id, code, guest_id, guest_full_name, guest_phone,
          room_type_id, check_in, check_out, adults, children, source, notes,
          no_phone, deposit_status, status, cancel_reason, cancel_notes, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13, $14,
          $15, $16, $17, $18, $19, $20, $21
        )
        RETURNING id, tenant_id, property_id, code, guest_id, guest_full_name, guest_phone,
                  room_type_id, check_in, check_out, adults, children, source, notes,
                  no_phone, deposit_status, status, cancel_reason, cancel_notes, created_at, updated_at`,
      [
        reservation.id,
        reservation.tenantId,
        reservation.propertyId,
        reservation.code,
        reservation.guestId,
        reservation.guestFullName,
        reservation.guestPhone ?? null,
        reservation.roomTypeId,
        reservation.checkIn,
        reservation.checkOut,
        reservation.adults,
        reservation.children,
        reservation.source,
        reservation.notes ?? null,
        reservation.noPhone,
        reservation.depositStatus,
        reservation.status,
        reservation.cancelReason ?? null,
        reservation.cancelNotes ?? null,
        reservation.createdAt,
        reservation.updatedAt,
      ],
    );

    return this.mapReservation(result.rows[0]);
  }

  async updateReservation(input: UpdateReservationInput): Promise<ReservationRecord> {
    const reservation = input.reservation;
    const result = await this.postgres.query(
      `UPDATE reservations
       SET guest_full_name = $1,
           guest_phone = $2,
           room_type_id = $3,
           check_in = $4,
           check_out = $5,
           adults = $6,
           children = $7,
           source = $8,
           notes = $9,
           no_phone = $10,
           deposit_status = $11,
           status = $12,
           cancel_reason = $13,
           cancel_notes = $14,
           updated_at = $15
       WHERE id = $16 AND tenant_id = $17 AND property_id = $18
       RETURNING id, tenant_id, property_id, code, guest_id, guest_full_name, guest_phone,
                 room_type_id, check_in, check_out, adults, children, source, notes,
                 no_phone, deposit_status, status, cancel_reason, cancel_notes, created_at, updated_at`,
      [
        reservation.guestFullName,
        reservation.guestPhone ?? null,
        reservation.roomTypeId,
        reservation.checkIn,
        reservation.checkOut,
        reservation.adults,
        reservation.children,
        reservation.source,
        reservation.notes ?? null,
        reservation.noPhone,
        reservation.depositStatus,
        reservation.status,
        reservation.cancelReason ?? null,
        reservation.cancelNotes ?? null,
        reservation.updatedAt,
        reservation.id,
        reservation.tenantId,
        reservation.propertyId,
      ],
    );

    return this.mapReservation(result.rows[0]);
  }

  async generateReservationCode(propertyId: string): Promise<string> {
    const seq = await this.postgres.query<{ seq: string }>(
      `SELECT nextval('reservation_code_seq')::text AS seq`,
    );

    const suffix = propertyId.replace(/-/g, '').slice(0, 4).toUpperCase();
    return `RSV-${suffix}-${seq.rows[0].seq}`;
  }

  async generateInvoiceNumber(propertyId: string): Promise<string> {
    const seq = await this.postgres.query<{ seq: string }>(
      `SELECT nextval('invoice_number_seq')::text AS seq`,
    );

    const suffix = propertyId.replace(/-/g, '').slice(0, 4).toUpperCase();
    return `INV-${suffix}-${seq.rows[0].seq}`;
  }

  async listStays(query: StayLookupQuery): Promise<StayRecord[]> {
    const result = await this.postgres.query(
      `SELECT id, tenant_id, property_id, reservation_id, guest_id, room_id, id_number,
              status, check_in_at, planned_check_out, check_out_at, notes, created_at, updated_at
       FROM stays
       WHERE tenant_id = $1 AND property_id = $2
       ORDER BY created_at DESC`,
      [query.tenantId, query.propertyId],
    );

    return result.rows.map((row) => this.mapStay(row));
  }

  async getStay(query: StayLookupQuery & { stayId: string }): Promise<StayRecord | undefined> {
    const result = await this.postgres.query(
      `SELECT id, tenant_id, property_id, reservation_id, guest_id, room_id, id_number,
              status, check_in_at, planned_check_out, check_out_at, notes, created_at, updated_at
       FROM stays
       WHERE id = $1 AND tenant_id = $2 AND property_id = $3
       LIMIT 1`,
      [query.stayId, query.tenantId, query.propertyId],
    );

    if (!result.rowCount) {
      return undefined;
    }

    return this.mapStay(result.rows[0]);
  }

  async createStay(input: CreateStayInput): Promise<StayRecord> {
    const stay = input.stay;
    const result = await this.postgres.query(
      `INSERT INTO stays (
          id, tenant_id, property_id, reservation_id, guest_id, room_id, id_number,
          status, check_in_at, planned_check_out, check_out_at, notes, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13, $14
        )
        RETURNING id, tenant_id, property_id, reservation_id, guest_id, room_id, id_number,
                  status, check_in_at, planned_check_out, check_out_at, notes, created_at, updated_at`,
      [
        stay.id,
        stay.tenantId,
        stay.propertyId,
        stay.reservationId,
        stay.guestId,
        stay.roomId ?? null,
        stay.idNumber ?? null,
        stay.status,
        stay.checkInAt,
        stay.plannedCheckOut,
        stay.checkOutAt ?? null,
        stay.notes ?? null,
        stay.createdAt,
        stay.updatedAt,
      ],
    );

    return this.mapStay(result.rows[0]);
  }

  async updateStay(input: UpdateStayInput): Promise<StayRecord> {
    const stay = input.stay;
    const result = await this.postgres.query(
      `UPDATE stays
       SET room_id = $1,
           id_number = $2,
           status = $3,
           planned_check_out = $4,
           check_out_at = $5,
           notes = $6,
           updated_at = $7
       WHERE id = $8 AND tenant_id = $9 AND property_id = $10
       RETURNING id, tenant_id, property_id, reservation_id, guest_id, room_id, id_number,
                 status, check_in_at, planned_check_out, check_out_at, notes, created_at, updated_at`,
      [
        stay.roomId ?? null,
        stay.idNumber ?? null,
        stay.status,
        stay.plannedCheckOut,
        stay.checkOutAt ?? null,
        stay.notes ?? null,
        stay.updatedAt,
        stay.id,
        stay.tenantId,
        stay.propertyId,
      ],
    );

    return this.mapStay(result.rows[0]);
  }

  async createHousekeepingTask(
    input: CreateHousekeepingTaskInput,
  ): Promise<HousekeepingTaskRecord> {
    const task = input.task;
    const result = await this.postgres.query(
      `INSERT INTO housekeeping_tasks (
          id, tenant_id, property_id, room_id, stay_id, status, assigned_user_id, note,
          created_at, updated_at, completed_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, tenant_id, property_id, room_id, stay_id, status, assigned_user_id,
                 note, created_at, updated_at, completed_at`,
      [
        task.id,
        task.tenantId,
        task.propertyId,
        task.roomId,
        task.stayId ?? null,
        task.status,
        task.assignedUserId ?? null,
        task.note,
        task.createdAt,
        task.updatedAt,
        task.completedAt ?? null,
      ],
    );

    return this.mapHousekeepingTask(result.rows[0]);
  }

  async listHousekeepingTasks(query: {
    tenantId: string;
    propertyId: string;
    status?: string;
    assignedUserId?: string;
    roomId?: string;
  }): Promise<HousekeepingTaskRecord[]> {
    const params: unknown[] = [query.tenantId, query.propertyId];
    let whereClause = 'tenant_id = $1 AND property_id = $2';

    if (query.status) {
      params.push(query.status);
      whereClause += ` AND status = $${params.length}`;
    }

    if (query.assignedUserId) {
      params.push(query.assignedUserId);
      whereClause += ` AND assigned_user_id = $${params.length}`;
    }

    if (query.roomId) {
      params.push(query.roomId);
      whereClause += ` AND room_id = $${params.length}`;
    }

    const result = await this.postgres.query(
      `SELECT id, tenant_id, property_id, room_id, stay_id, status, assigned_user_id,
              note, created_at, updated_at, completed_at
       FROM housekeeping_tasks
       WHERE ${whereClause}
       ORDER BY created_at DESC`,
      params,
    );

    return result.rows.map((row) => this.mapHousekeepingTask(row));
  }

  async getHousekeepingTask(query: {
    tenantId: string;
    propertyId: string;
    taskId: string;
  }): Promise<HousekeepingTaskRecord | undefined> {
    const result = await this.postgres.query(
      `SELECT id, tenant_id, property_id, room_id, stay_id, status, assigned_user_id,
              note, created_at, updated_at, completed_at
       FROM housekeeping_tasks
       WHERE id = $1 AND tenant_id = $2 AND property_id = $3
       LIMIT 1`,
      [query.taskId, query.tenantId, query.propertyId],
    );

    if (!result.rowCount) {
      return undefined;
    }

    return this.mapHousekeepingTask(result.rows[0]);
  }

  async updateHousekeepingTask(
    input: UpdateHousekeepingTaskInput,
  ): Promise<HousekeepingTaskRecord | undefined> {
    const task = input.task;
    const params: unknown[] = [
      task.status,
      task.assignedUserId ?? null,
      task.note,
      task.updatedAt,
      task.completedAt ?? null,
      task.id,
      task.tenantId,
      task.propertyId,
    ];
    let whereClause = 'id = $6 AND tenant_id = $7 AND property_id = $8';

    if (input.expectedUpdatedAt) {
      params.push(input.expectedUpdatedAt);
      whereClause += ` AND updated_at = $${params.length}`;
    }

    const result = await this.postgres.query(
      `UPDATE housekeeping_tasks
       SET status = $1,
           assigned_user_id = $2,
           note = $3,
           updated_at = $4,
           completed_at = $5
       WHERE ${whereClause}
       RETURNING id, tenant_id, property_id, room_id, stay_id, status, assigned_user_id,
                 note, created_at, updated_at, completed_at`,
      params,
    );

    if (!result.rowCount) {
      return undefined;
    }

    return this.mapHousekeepingTask(result.rows[0]);
  }

  async getActiveHousekeepingTaskForRoom(query: {
    tenantId: string;
    propertyId: string;
    roomId: string;
  }): Promise<HousekeepingTaskRecord | undefined> {
    const result = await this.postgres.query(
      `SELECT id, tenant_id, property_id, room_id, stay_id, status, assigned_user_id,
              note, created_at, updated_at, completed_at
       FROM housekeeping_tasks
       WHERE tenant_id = $1
         AND property_id = $2
         AND room_id = $3
         AND status IN ('DIRTY', 'CLEANING', 'CLEAN')
       ORDER BY created_at DESC
       LIMIT 1`,
      [query.tenantId, query.propertyId, query.roomId],
    );

    if (!result.rowCount) {
      return undefined;
    }

    return this.mapHousekeepingTask(result.rows[0]);
  }

  async createMaintenanceTicket(input: CreateMaintenanceTicketInput): Promise<MaintenanceTicketRecord> {
    const ticket = input.ticket;
    const result = await this.postgres.query(
      `INSERT INTO maintenance_tickets (
          id, tenant_id, property_id, room_id, title, description, severity, status, photo_url,
          reported_by_user_id, resolved_by_user_id, created_at, updated_at, resolved_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9,
          $10, $11, $12, $13, $14
        )
       RETURNING id, tenant_id, property_id, room_id, title, description, severity, status,
                 photo_url, reported_by_user_id, resolved_by_user_id, created_at, updated_at, resolved_at`,
      [
        ticket.id,
        ticket.tenantId,
        ticket.propertyId,
        ticket.roomId,
        ticket.title,
        ticket.description,
        ticket.severity,
        ticket.status,
        ticket.photoUrl ?? null,
        ticket.reportedByUserId,
        ticket.resolvedByUserId ?? null,
        ticket.createdAt,
        ticket.updatedAt,
        ticket.resolvedAt ?? null,
      ],
    );

    return this.mapMaintenanceTicket(result.rows[0]);
  }

  async listMaintenanceTickets(query: {
    tenantId: string;
    propertyId: string;
    status?: string;
    severity?: string;
    roomId?: string;
  }): Promise<MaintenanceTicketRecord[]> {
    const params: unknown[] = [query.tenantId, query.propertyId];
    let whereClause = 'tenant_id = $1 AND property_id = $2';

    if (query.status) {
      params.push(query.status);
      whereClause += ` AND status = $${params.length}`;
    }

    if (query.severity) {
      params.push(query.severity);
      whereClause += ` AND severity = $${params.length}`;
    }

    if (query.roomId) {
      params.push(query.roomId);
      whereClause += ` AND room_id = $${params.length}`;
    }

    const result = await this.postgres.query(
      `SELECT id, tenant_id, property_id, room_id, title, description, severity, status,
              photo_url, reported_by_user_id, resolved_by_user_id, created_at, updated_at, resolved_at
       FROM maintenance_tickets
       WHERE ${whereClause}
       ORDER BY created_at DESC`,
      params,
    );

    return result.rows.map((row) => this.mapMaintenanceTicket(row));
  }

  async getMaintenanceTicket(query: {
    tenantId: string;
    propertyId: string;
    ticketId: string;
  }): Promise<MaintenanceTicketRecord | undefined> {
    const result = await this.postgres.query(
      `SELECT id, tenant_id, property_id, room_id, title, description, severity, status,
              photo_url, reported_by_user_id, resolved_by_user_id, created_at, updated_at, resolved_at
       FROM maintenance_tickets
       WHERE id = $1 AND tenant_id = $2 AND property_id = $3
       LIMIT 1`,
      [query.ticketId, query.tenantId, query.propertyId],
    );

    if (!result.rowCount) {
      return undefined;
    }

    return this.mapMaintenanceTicket(result.rows[0]);
  }

  async updateMaintenanceTicket(input: UpdateMaintenanceTicketInput): Promise<MaintenanceTicketRecord> {
    const ticket = input.ticket;
    const result = await this.postgres.query(
      `UPDATE maintenance_tickets
       SET title = $1,
           description = $2,
           severity = $3,
           status = $4,
           photo_url = $5,
           resolved_by_user_id = $6,
           updated_at = $7,
           resolved_at = $8
       WHERE id = $9 AND tenant_id = $10 AND property_id = $11
       RETURNING id, tenant_id, property_id, room_id, title, description, severity, status,
                 photo_url, reported_by_user_id, resolved_by_user_id, created_at, updated_at, resolved_at`,
      [
        ticket.title,
        ticket.description,
        ticket.severity,
        ticket.status,
        ticket.photoUrl ?? null,
        ticket.resolvedByUserId ?? null,
        ticket.updatedAt,
        ticket.resolvedAt ?? null,
        ticket.id,
        ticket.tenantId,
        ticket.propertyId,
      ],
    );

    return this.mapMaintenanceTicket(result.rows[0]);
  }

  async createShiftHandover(input: CreateShiftHandoverInput): Promise<ShiftHandoverRecord> {
    const handover = input.handover;
    const result = await this.postgres.query(
      `INSERT INTO shift_handover_notes (
          id, tenant_id, property_id, user_id, shift_type, notes, exceptions, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, tenant_id, property_id, user_id, shift_type, notes, exceptions, created_at`,
      [
        handover.id,
        handover.tenantId,
        handover.propertyId,
        handover.userId,
        handover.shiftType,
        handover.notes,
        JSON.stringify(handover.exceptions),
        handover.createdAt,
      ],
    );

    return this.mapShiftHandover(result.rows[0]);
  }

  async listShiftHandovers(query: {
    tenantId: string;
    propertyId: string;
    userId?: string;
    shiftType?: string;
  }): Promise<ShiftHandoverRecord[]> {
    const params: unknown[] = [query.tenantId, query.propertyId];
    let whereClause = 'tenant_id = $1 AND property_id = $2';

    if (query.userId) {
      params.push(query.userId);
      whereClause += ` AND user_id = $${params.length}`;
    }

    if (query.shiftType) {
      params.push(query.shiftType);
      whereClause += ` AND shift_type = $${params.length}`;
    }

    const result = await this.postgres.query(
      `SELECT id, tenant_id, property_id, user_id, shift_type, notes, exceptions, created_at
       FROM shift_handover_notes
       WHERE ${whereClause}
       ORDER BY created_at DESC`,
      params,
    );

    return result.rows.map((row) => this.mapShiftHandover(row));
  }

  async createFinanceShiftHandover(
    input: CreateFinanceShiftHandoverInput,
  ): Promise<FinanceShiftHandoverRecord> {
    const handover = input.handover;
    const result = await this.postgres.query(
      `INSERT INTO finance_shift_handovers (
          id, tenant_id, property_id, user_id, shift_type, cash_on_hand, pending_refunds, notes, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, tenant_id, property_id, user_id, shift_type, cash_on_hand, pending_refunds, notes, created_at`,
      [
        handover.id,
        handover.tenantId,
        handover.propertyId,
        handover.userId,
        handover.shiftType,
        handover.cashOnHand,
        handover.pendingRefunds,
        handover.notes,
        handover.createdAt,
      ],
    );

    return this.mapFinanceShiftHandover(result.rows[0]);
  }

  async listFinanceShiftHandovers(query: {
    tenantId: string;
    propertyId: string;
    userId?: string;
    shiftType?: string;
  }): Promise<FinanceShiftHandoverRecord[]> {
    const params: unknown[] = [query.tenantId, query.propertyId];
    let whereClause = 'tenant_id = $1 AND property_id = $2';

    if (query.userId) {
      params.push(query.userId);
      whereClause += ` AND user_id = $${params.length}`;
    }

    if (query.shiftType) {
      params.push(query.shiftType);
      whereClause += ` AND shift_type = $${params.length}`;
    }

    const result = await this.postgres.query(
      `SELECT id, tenant_id, property_id, user_id, shift_type, cash_on_hand, pending_refunds, notes, created_at
       FROM finance_shift_handovers
       WHERE ${whereClause}
       ORDER BY created_at DESC`,
      params,
    );

    return result.rows.map((row) => this.mapFinanceShiftHandover(row));
  }

  async createConfirmation(input: CreateConfirmationInput): Promise<ConfirmationRecord> {
    const confirmation = input.confirmation;
    const result = await this.postgres.query(
      `INSERT INTO confirmations (
          id, tenant_id, property_id, entity_type, entity_id, template, channel,
          to_phone, language, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id, tenant_id, property_id, entity_type, entity_id, template,
                  channel, to_phone, language, status, created_at`,
      [
        confirmation.id,
        confirmation.tenantId,
        confirmation.propertyId,
        confirmation.entityType,
        confirmation.entityId,
        confirmation.template,
        confirmation.channel,
        confirmation.toPhone ?? null,
        confirmation.language ?? null,
        confirmation.status,
        confirmation.createdAt,
      ],
    );

    return this.mapConfirmation(result.rows[0]);
  }

  async listConfirmations(query: {
    tenantId: string;
    propertyId: string;
  }): Promise<ConfirmationRecord[]> {
    const result = await this.postgres.query(
      `SELECT id, tenant_id, property_id, entity_type, entity_id, template,
              channel, to_phone, language, status, created_at
       FROM confirmations
       WHERE tenant_id = $1 AND property_id = $2
       ORDER BY created_at DESC`,
      [query.tenantId, query.propertyId],
    );

    return result.rows.map((row) => this.mapConfirmation(row));
  }

  async listDiscountRequests(query: {
    tenantId: string;
    propertyId: string;
    status?: string;
  }): Promise<DiscountRequestRecord[]> {
    const params: unknown[] = [query.tenantId, query.propertyId];
    let whereClause = 'tenant_id = $1 AND property_id = $2';

    if (query.status) {
      params.push(query.status);
      whereClause += ` AND status = $${params.length}`;
    }

    const result = await this.postgres.query(
      `SELECT id, tenant_id, property_id, entity_type, entity_id, discount_type, value, reason,
              status, requested_by_user_id, approved_by_user_id, rejected_by_user_id, note,
              rejection_reason, applied_line_item_id, created_at, updated_at
       FROM discount_requests
       WHERE ${whereClause}
       ORDER BY created_at DESC`,
      params,
    );

    return result.rows.map((row) => this.mapDiscountRequest(row));
  }

  async getDiscountRequest(query: {
    tenantId: string;
    propertyId: string;
    requestId: string;
  }): Promise<DiscountRequestRecord | undefined> {
    const result = await this.postgres.query(
      `SELECT id, tenant_id, property_id, entity_type, entity_id, discount_type, value, reason,
              status, requested_by_user_id, approved_by_user_id, rejected_by_user_id, note,
              rejection_reason, applied_line_item_id, created_at, updated_at
       FROM discount_requests
       WHERE id = $1 AND tenant_id = $2 AND property_id = $3
       LIMIT 1`,
      [query.requestId, query.tenantId, query.propertyId],
    );

    if (!result.rowCount) {
      return undefined;
    }

    return this.mapDiscountRequest(result.rows[0]);
  }

  async createDiscountRequest(input: CreateDiscountRequestInput): Promise<DiscountRequestRecord> {
    const request = input.request;
    const result = await this.postgres.query(
      `INSERT INTO discount_requests (
          id, tenant_id, property_id, entity_type, entity_id, discount_type, value, reason,
          status, requested_by_user_id, approved_by_user_id, rejected_by_user_id, note,
          rejection_reason, applied_line_item_id, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14, $15, $16, $17
        )
        RETURNING id, tenant_id, property_id, entity_type, entity_id, discount_type, value, reason,
                  status, requested_by_user_id, approved_by_user_id, rejected_by_user_id, note,
                  rejection_reason, applied_line_item_id, created_at, updated_at`,
      [
        request.id,
        request.tenantId,
        request.propertyId,
        request.entityType,
        request.entityId,
        request.discountType,
        request.value,
        request.reason,
        request.status,
        request.requestedByUserId,
        request.approvedByUserId ?? null,
        request.rejectedByUserId ?? null,
        request.note ?? null,
        request.rejectionReason ?? null,
        request.appliedLineItemId ?? null,
        request.createdAt,
        request.updatedAt,
      ],
    );

    return this.mapDiscountRequest(result.rows[0]);
  }

  async updateDiscountRequest(input: UpdateDiscountRequestInput): Promise<DiscountRequestRecord> {
    const request = input.request;
    const result = await this.postgres.query(
      `UPDATE discount_requests
       SET status = $1,
           approved_by_user_id = $2,
           rejected_by_user_id = $3,
           note = $4,
           rejection_reason = $5,
           applied_line_item_id = $6,
           updated_at = $7
       WHERE id = $8 AND tenant_id = $9 AND property_id = $10
       RETURNING id, tenant_id, property_id, entity_type, entity_id, discount_type, value, reason,
                 status, requested_by_user_id, approved_by_user_id, rejected_by_user_id, note,
                 rejection_reason, applied_line_item_id, created_at, updated_at`,
      [
        request.status,
        request.approvedByUserId ?? null,
        request.rejectedByUserId ?? null,
        request.note ?? null,
        request.rejectionReason ?? null,
        request.appliedLineItemId ?? null,
        request.updatedAt,
        request.id,
        request.tenantId,
        request.propertyId,
      ],
    );

    return this.mapDiscountRequest(result.rows[0]);
  }

  async listRefundRequests(query: {
    tenantId: string;
    propertyId: string;
    status?: string;
  }): Promise<RefundRequestRecord[]> {
    const params: unknown[] = [query.tenantId, query.propertyId];
    let whereClause = 'tenant_id = $1 AND property_id = $2';

    if (query.status) {
      params.push(query.status);
      whereClause += ` AND status = $${params.length}`;
    }

    const result = await this.postgres.query(
      `SELECT id, tenant_id, property_id, invoice_id, amount, reason, status, requested_by_user_id,
              approved_by_user_id, rejected_by_user_id, note, rejection_reason, created_at, updated_at
       FROM refund_requests
       WHERE ${whereClause}
       ORDER BY created_at DESC`,
      params,
    );

    return result.rows.map((row) => this.mapRefundRequest(row));
  }

  async getRefundRequest(query: {
    tenantId: string;
    propertyId: string;
    requestId: string;
  }): Promise<RefundRequestRecord | undefined> {
    const result = await this.postgres.query(
      `SELECT id, tenant_id, property_id, invoice_id, amount, reason, status, requested_by_user_id,
              approved_by_user_id, rejected_by_user_id, note, rejection_reason, created_at, updated_at
       FROM refund_requests
       WHERE id = $1 AND tenant_id = $2 AND property_id = $3
       LIMIT 1`,
      [query.requestId, query.tenantId, query.propertyId],
    );

    if (!result.rowCount) {
      return undefined;
    }

    return this.mapRefundRequest(result.rows[0]);
  }

  async createRefundRequest(input: CreateRefundRequestInput): Promise<RefundRequestRecord> {
    const request = input.request;
    const result = await this.postgres.query(
      `INSERT INTO refund_requests (
          id, tenant_id, property_id, invoice_id, amount, reason, status, requested_by_user_id,
          approved_by_user_id, rejected_by_user_id, note, rejection_reason, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14
        )
        RETURNING id, tenant_id, property_id, invoice_id, amount, reason, status, requested_by_user_id,
                  approved_by_user_id, rejected_by_user_id, note, rejection_reason, created_at, updated_at`,
      [
        request.id,
        request.tenantId,
        request.propertyId,
        request.invoiceId,
        request.amount,
        request.reason,
        request.status,
        request.requestedByUserId,
        request.approvedByUserId ?? null,
        request.rejectedByUserId ?? null,
        request.note ?? null,
        request.rejectionReason ?? null,
        request.createdAt,
        request.updatedAt,
      ],
    );

    return this.mapRefundRequest(result.rows[0]);
  }

  async updateRefundRequest(input: UpdateRefundRequestInput): Promise<RefundRequestRecord> {
    const request = input.request;
    const result = await this.postgres.query(
      `UPDATE refund_requests
       SET status = $1,
           approved_by_user_id = $2,
           rejected_by_user_id = $3,
           note = $4,
           rejection_reason = $5,
           updated_at = $6
       WHERE id = $7 AND tenant_id = $8 AND property_id = $9
       RETURNING id, tenant_id, property_id, invoice_id, amount, reason, status, requested_by_user_id,
                 approved_by_user_id, rejected_by_user_id, note, rejection_reason, created_at, updated_at`,
      [
        request.status,
        request.approvedByUserId ?? null,
        request.rejectedByUserId ?? null,
        request.note ?? null,
        request.rejectionReason ?? null,
        request.updatedAt,
        request.id,
        request.tenantId,
        request.propertyId,
      ],
    );

    return this.mapRefundRequest(result.rows[0]);
  }

  async listOverrideRequests(query: {
    tenantId: string;
    propertyId: string;
    status?: string;
  }): Promise<OverrideRequestRecord[]> {
    const params: unknown[] = [query.tenantId, query.propertyId];
    let whereClause = 'tenant_id = $1 AND property_id = $2';

    if (query.status) {
      params.push(query.status);
      whereClause += ` AND status = $${params.length}`;
    }

    const result = await this.postgres.query(
      `SELECT id, tenant_id, property_id, override_type, entity_type, entity_id, reason,
              requested_value, status, requested_by_user_id, approved_by_user_id, rejected_by_user_id,
              note, rejection_reason, override_token, override_token_expires_at, created_at, updated_at
       FROM override_requests
       WHERE ${whereClause}
       ORDER BY created_at DESC`,
      params,
    );

    return result.rows.map((row) => this.mapOverrideRequest(row));
  }

  async getOverrideRequest(query: {
    tenantId: string;
    propertyId: string;
    requestId: string;
  }): Promise<OverrideRequestRecord | undefined> {
    const result = await this.postgres.query(
      `SELECT id, tenant_id, property_id, override_type, entity_type, entity_id, reason,
              requested_value, status, requested_by_user_id, approved_by_user_id, rejected_by_user_id,
              note, rejection_reason, override_token, override_token_expires_at, created_at, updated_at
       FROM override_requests
       WHERE id = $1 AND tenant_id = $2 AND property_id = $3
       LIMIT 1`,
      [query.requestId, query.tenantId, query.propertyId],
    );

    if (!result.rowCount) {
      return undefined;
    }

    return this.mapOverrideRequest(result.rows[0]);
  }

  async createOverrideRequest(input: CreateOverrideRequestInput): Promise<OverrideRequestRecord> {
    const request = input.request;
    const result = await this.postgres.query(
      `INSERT INTO override_requests (
          id, tenant_id, property_id, override_type, entity_type, entity_id, reason,
          requested_value, status, requested_by_user_id, approved_by_user_id, rejected_by_user_id,
          note, rejection_reason, override_token, override_token_expires_at, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8::jsonb, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
        )
        RETURNING id, tenant_id, property_id, override_type, entity_type, entity_id, reason,
                  requested_value, status, requested_by_user_id, approved_by_user_id, rejected_by_user_id,
                  note, rejection_reason, override_token, override_token_expires_at, created_at, updated_at`,
      [
        request.id,
        request.tenantId,
        request.propertyId,
        request.overrideType,
        request.entityType,
        request.entityId,
        request.reason,
        JSON.stringify(request.requestedValue ?? null),
        request.status,
        request.requestedByUserId,
        request.approvedByUserId ?? null,
        request.rejectedByUserId ?? null,
        request.note ?? null,
        request.rejectionReason ?? null,
        request.overrideToken ?? null,
        request.overrideTokenExpiresAt ?? null,
        request.createdAt,
        request.updatedAt,
      ],
    );

    return this.mapOverrideRequest(result.rows[0]);
  }

  async updateOverrideRequest(input: UpdateOverrideRequestInput): Promise<OverrideRequestRecord> {
    const request = input.request;
    const result = await this.postgres.query(
      `UPDATE override_requests
       SET status = $1,
           approved_by_user_id = $2,
           rejected_by_user_id = $3,
           note = $4,
           rejection_reason = $5,
           override_token = $6,
           override_token_expires_at = $7,
           updated_at = $8
       WHERE id = $9 AND tenant_id = $10 AND property_id = $11
       RETURNING id, tenant_id, property_id, override_type, entity_type, entity_id, reason,
                 requested_value, status, requested_by_user_id, approved_by_user_id, rejected_by_user_id,
                 note, rejection_reason, override_token, override_token_expires_at, created_at, updated_at`,
      [
        request.status,
        request.approvedByUserId ?? null,
        request.rejectedByUserId ?? null,
        request.note ?? null,
        request.rejectionReason ?? null,
        request.overrideToken ?? null,
        request.overrideTokenExpiresAt ?? null,
        request.updatedAt,
        request.id,
        request.tenantId,
        request.propertyId,
      ],
    );

    return this.mapOverrideRequest(result.rows[0]);
  }

  async createFolioLineItem(input: CreateFolioLineItemInput): Promise<FolioLineItemRecord> {
    const lineItem = input.lineItem;
    const result = await this.postgres.query(
      `INSERT INTO folio_line_items (
          id, tenant_id, property_id, invoice_id, reference_order_id, entity_type, entity_id, line_type,
          amount, currency, description, created_by_user_id, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13
        )
        RETURNING id, tenant_id, property_id, invoice_id, reference_order_id, entity_type, entity_id,
                  line_type, amount, currency, description, created_by_user_id, created_at`,
      [
        lineItem.id,
        lineItem.tenantId,
        lineItem.propertyId,
        lineItem.invoiceId ?? null,
        lineItem.referenceOrderId ?? null,
        lineItem.entityType,
        lineItem.entityId,
        lineItem.lineType,
        lineItem.amount,
        lineItem.currency,
        lineItem.description,
        lineItem.createdByUserId,
        lineItem.createdAt,
      ],
    );

    return this.mapFolioLineItem(result.rows[0]);
  }

  async listFolioLineItems(query: {
    tenantId: string;
    propertyId: string;
    invoiceId?: string;
    entityType?: string;
    entityId?: string;
  }): Promise<FolioLineItemRecord[]> {
    const params: unknown[] = [query.tenantId, query.propertyId];
    let whereClause = 'tenant_id = $1 AND property_id = $2';

    if (query.invoiceId) {
      params.push(query.invoiceId);
      whereClause += ` AND invoice_id = $${params.length}`;
    }

    if (query.entityType) {
      params.push(query.entityType);
      whereClause += ` AND entity_type = $${params.length}`;
    }

    if (query.entityId) {
      params.push(query.entityId);
      whereClause += ` AND entity_id = $${params.length}`;
    }

    const result = await this.postgres.query(
      `SELECT id, tenant_id, property_id, invoice_id, reference_order_id, entity_type, entity_id,
              line_type, amount, currency, description, created_by_user_id, created_at
       FROM folio_line_items
       WHERE ${whereClause}
       ORDER BY created_at DESC`,
      params,
    );

    return result.rows.map((row) => this.mapFolioLineItem(row));
  }

  async listPayments(query: {
    tenantId: string;
    propertyId: string;
    invoiceId?: string;
    date?: string;
  }): Promise<PaymentRecord[]> {
    const params: unknown[] = [query.tenantId, query.propertyId];
    let whereClause = 'tenant_id = $1 AND property_id = $2';

    if (query.invoiceId) {
      params.push(query.invoiceId);
      whereClause += ` AND invoice_id = $${params.length}`;
    }

    if (query.date) {
      params.push(query.date);
      whereClause += ` AND DATE(created_at) = $${params.length}`;
    }

    const result = await this.postgres.query(
      `SELECT id, tenant_id, property_id, invoice_id, method, amount, payment_type, status, reference,
              note, created_by_user_id, created_at, updated_at
       FROM payments
       WHERE ${whereClause}
       ORDER BY created_at DESC`,
      params,
    );

    return result.rows.map((row) => this.mapPayment(row));
  }

  async getPayment(query: {
    tenantId: string;
    propertyId: string;
    paymentId: string;
  }): Promise<PaymentRecord | undefined> {
    const result = await this.postgres.query(
      `SELECT id, tenant_id, property_id, invoice_id, method, amount, payment_type, status, reference,
              note, created_by_user_id, created_at, updated_at
       FROM payments
       WHERE id = $1 AND tenant_id = $2 AND property_id = $3
       LIMIT 1`,
      [query.paymentId, query.tenantId, query.propertyId],
    );

    if (!result.rowCount) {
      return undefined;
    }

    return this.mapPayment(result.rows[0]);
  }

  async createPayment(input: CreatePaymentInput): Promise<PaymentRecord> {
    const payment = input.payment;
    const result = await this.postgres.query(
      `INSERT INTO payments (
          id, tenant_id, property_id, invoice_id, method, amount, payment_type, status, reference,
          note, created_by_user_id, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9,
          $10, $11, $12, $13
        )
        RETURNING id, tenant_id, property_id, invoice_id, method, amount, payment_type, status, reference,
                  note, created_by_user_id, created_at, updated_at`,
      [
        payment.id,
        payment.tenantId,
        payment.propertyId,
        payment.invoiceId,
        payment.method,
        payment.amount,
        payment.paymentType,
        payment.status,
        payment.reference ?? null,
        payment.note ?? null,
        payment.createdByUserId,
        payment.createdAt,
        payment.updatedAt,
      ],
    );

    return this.mapPayment(result.rows[0]);
  }

  async updatePayment(input: UpdatePaymentInput): Promise<PaymentRecord> {
    const payment = input.payment;
    const result = await this.postgres.query(
      `UPDATE payments
       SET method = $1,
           amount = $2,
           payment_type = $3,
           status = $4,
           reference = $5,
           note = $6,
           updated_at = $7
       WHERE id = $8 AND tenant_id = $9 AND property_id = $10
       RETURNING id, tenant_id, property_id, invoice_id, method, amount, payment_type, status, reference,
                 note, created_by_user_id, created_at, updated_at`,
      [
        payment.method,
        payment.amount,
        payment.paymentType,
        payment.status,
        payment.reference ?? null,
        payment.note ?? null,
        payment.updatedAt,
        payment.id,
        payment.tenantId,
        payment.propertyId,
      ],
    );

    return this.mapPayment(result.rows[0]);
  }

  async getRefundExecutionByRequest(query: {
    tenantId: string;
    propertyId: string;
    refundRequestId: string;
  }): Promise<RefundExecutionRecord | undefined> {
    const result = await this.postgres.query(
      `SELECT id, tenant_id, property_id, refund_request_id, payment_id, method, amount,
              reference, note, executed_by_user_id, created_at
       FROM refund_executions
       WHERE tenant_id = $1 AND property_id = $2 AND refund_request_id = $3
       LIMIT 1`,
      [query.tenantId, query.propertyId, query.refundRequestId],
    );

    if (!result.rowCount) {
      return undefined;
    }

    return this.mapRefundExecution(result.rows[0]);
  }

  async createRefundExecution(
    input: CreateRefundExecutionInput,
  ): Promise<RefundExecutionRecord> {
    const execution = input.execution;
    const result = await this.postgres.query(
      `INSERT INTO refund_executions (
          id, tenant_id, property_id, refund_request_id, payment_id, method, amount,
          reference, note, executed_by_user_id, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11
        )
        RETURNING id, tenant_id, property_id, refund_request_id, payment_id, method, amount,
                  reference, note, executed_by_user_id, created_at`,
      [
        execution.id,
        execution.tenantId,
        execution.propertyId,
        execution.refundRequestId,
        execution.paymentId,
        execution.method,
        execution.amount,
        execution.reference ?? null,
        execution.note ?? null,
        execution.executedByUserId,
        execution.createdAt,
      ],
    );

    return this.mapRefundExecution(result.rows[0]);
  }

  async listInventoryBlocks(query: {
    tenantId: string;
    propertyId: string;
    roomTypeId?: string;
    from?: string;
    to?: string;
  }): Promise<InventoryBlockRecord[]> {
    const params: unknown[] = [query.tenantId, query.propertyId];
    let whereClause = 'tenant_id = $1 AND property_id = $2';

    if (query.roomTypeId) {
      params.push(query.roomTypeId);
      whereClause += ` AND room_type_id = $${params.length}`;
    }

    if (query.from) {
      params.push(query.from);
      whereClause += ` AND to_date >= $${params.length}`;
    }

    if (query.to) {
      params.push(query.to);
      whereClause += ` AND from_date <= $${params.length}`;
    }

    const result = await this.postgres.query(
      `SELECT id, tenant_id, property_id, room_type_id, from_date, to_date, units_blocked,
              reason, created_by_user_id, created_at
       FROM inventory_blocks
       WHERE ${whereClause}
       ORDER BY created_at DESC`,
      params,
    );

    return result.rows.map((row) => this.mapInventoryBlock(row));
  }

  async createInventoryBlock(input: CreateInventoryBlockInput): Promise<InventoryBlockRecord> {
    const block = input.block;
    const result = await this.postgres.query(
      `INSERT INTO inventory_blocks (
          id, tenant_id, property_id, room_type_id, from_date, to_date, units_blocked,
          reason, created_by_user_id, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10
        )
        RETURNING id, tenant_id, property_id, room_type_id, from_date, to_date, units_blocked,
                  reason, created_by_user_id, created_at`,
      [
        block.id,
        block.tenantId,
        block.propertyId,
        block.roomTypeId,
        block.fromDate,
        block.toDate,
        block.unitsBlocked,
        block.reason,
        block.createdByUserId,
        block.createdAt,
      ],
    );

    return this.mapInventoryBlock(result.rows[0]);
  }

  async listInventoryOverrides(query: {
    tenantId: string;
    propertyId: string;
    roomTypeId?: string;
    from?: string;
    to?: string;
  }): Promise<InventoryOverrideRecord[]> {
    const params: unknown[] = [query.tenantId, query.propertyId];
    let whereClause = 'tenant_id = $1 AND property_id = $2';

    if (query.roomTypeId) {
      params.push(query.roomTypeId);
      whereClause += ` AND room_type_id = $${params.length}`;
    }

    if (query.from) {
      params.push(query.from);
      whereClause += ` AND date >= $${params.length}`;
    }

    if (query.to) {
      params.push(query.to);
      whereClause += ` AND date <= $${params.length}`;
    }

    const result = await this.postgres.query(
      `SELECT id, tenant_id, property_id, room_type_id, date, new_available_units, reason,
              created_by_user_id, created_at
       FROM inventory_overrides
       WHERE ${whereClause}
       ORDER BY created_at DESC`,
      params,
    );

    return result.rows.map((row) => this.mapInventoryOverride(row));
  }

  async createInventoryOverride(
    input: CreateInventoryOverrideInput,
  ): Promise<InventoryOverrideRecord> {
    const override = input.override;
    const result = await this.postgres.query(
      `INSERT INTO inventory_overrides (
          id, tenant_id, property_id, room_type_id, date, new_available_units, reason,
          created_by_user_id, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9
        )
        RETURNING id, tenant_id, property_id, room_type_id, date, new_available_units, reason,
                  created_by_user_id, created_at`,
      [
        override.id,
        override.tenantId,
        override.propertyId,
        override.roomTypeId,
        override.date,
        override.newAvailableUnits,
        override.reason,
        override.createdByUserId,
        override.createdAt,
      ],
    );

    return this.mapInventoryOverride(result.rows[0]);
  }

  async getDayControl(query: {
    tenantId: string;
    propertyId: string;
    date: string;
  }): Promise<DayControlRecord | undefined> {
    const result = await this.postgres.query(
      `SELECT id, tenant_id, property_id, date, is_locked, unlocked_by_user_id, unlock_reason,
              created_at, updated_at
       FROM day_controls
       WHERE tenant_id = $1 AND property_id = $2 AND date = $3
       LIMIT 1`,
      [query.tenantId, query.propertyId, query.date],
    );

    if (!result.rowCount) {
      return undefined;
    }

    return this.mapDayControl(result.rows[0]);
  }

  async upsertDayControl(input: UpsertDayControlInput): Promise<DayControlRecord> {
    const control = input.control;
    const result = await this.postgres.query(
      `INSERT INTO day_controls (
          id, tenant_id, property_id, date, is_locked, unlocked_by_user_id, unlock_reason,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9
        )
        ON CONFLICT (tenant_id, property_id, date)
        DO UPDATE SET
          is_locked = EXCLUDED.is_locked,
          unlocked_by_user_id = EXCLUDED.unlocked_by_user_id,
          unlock_reason = EXCLUDED.unlock_reason,
          updated_at = EXCLUDED.updated_at
        RETURNING id, tenant_id, property_id, date, is_locked, unlocked_by_user_id, unlock_reason,
                  created_at, updated_at`,
      [
        control.id,
        control.tenantId,
        control.propertyId,
        control.date,
        control.isLocked,
        control.unlockedByUserId ?? null,
        control.unlockReason ?? null,
        control.createdAt,
        control.updatedAt,
      ],
    );

    return this.mapDayControl(result.rows[0]);
  }

  async listDailyCloseReports(query: {
    tenantId: string;
    propertyId: string;
    date?: string;
    limit?: number;
  }): Promise<DailyCloseReportRecord[]> {
    const params: unknown[] = [query.tenantId, query.propertyId];
    let whereClause = 'tenant_id = $1 AND property_id = $2';

    if (query.date) {
      params.push(query.date);
      whereClause += ` AND date = $${params.length}`;
    }

    params.push(query.limit ?? 100);
    const result = await this.postgres.query(
      `SELECT id, tenant_id, property_id, date, status, expected_cash, expected_transfer, expected_pos,
              counted_cash, counted_transfer, counted_pos, variance_cash, variance_transfer, variance_pos,
              note, closed_by_user_id, created_at, updated_at
       FROM daily_close_reports
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.length}`,
      params,
    );

    return result.rows.map((row) => this.mapDailyCloseReport(row));
  }

  async getDailyCloseReport(query: {
    tenantId: string;
    propertyId: string;
    date: string;
  }): Promise<DailyCloseReportRecord | undefined> {
    const result = await this.postgres.query(
      `SELECT id, tenant_id, property_id, date, status, expected_cash, expected_transfer, expected_pos,
              counted_cash, counted_transfer, counted_pos, variance_cash, variance_transfer, variance_pos,
              note, closed_by_user_id, created_at, updated_at
       FROM daily_close_reports
       WHERE tenant_id = $1 AND property_id = $2 AND date = $3
       LIMIT 1`,
      [query.tenantId, query.propertyId, query.date],
    );

    if (!result.rowCount) {
      return undefined;
    }

    return this.mapDailyCloseReport(result.rows[0]);
  }

  async createDailyCloseReport(
    input: CreateDailyCloseReportInput,
  ): Promise<DailyCloseReportRecord> {
    const report = input.report;
    const result = await this.postgres.query(
      `INSERT INTO daily_close_reports (
          id, tenant_id, property_id, date, status, expected_cash, expected_transfer, expected_pos,
          counted_cash, counted_transfer, counted_pos, variance_cash, variance_transfer, variance_pos,
          note, closed_by_user_id, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
        )
        RETURNING id, tenant_id, property_id, date, status, expected_cash, expected_transfer, expected_pos,
                  counted_cash, counted_transfer, counted_pos, variance_cash, variance_transfer, variance_pos,
                  note, closed_by_user_id, created_at, updated_at`,
      [
        report.id,
        report.tenantId,
        report.propertyId,
        report.date,
        report.status,
        report.expectedCash,
        report.expectedTransfer,
        report.expectedPos,
        report.countedCash,
        report.countedTransfer,
        report.countedPos,
        report.varianceCash,
        report.varianceTransfer,
        report.variancePos,
        report.note ?? null,
        report.closedByUserId,
        report.createdAt,
        report.updatedAt,
      ],
    );

    return this.mapDailyCloseReport(result.rows[0]);
  }

  async updateDailyCloseReport(
    input: UpdateDailyCloseReportInput,
  ): Promise<DailyCloseReportRecord> {
    const report = input.report;
    const result = await this.postgres.query(
      `UPDATE daily_close_reports
       SET status = $1,
           expected_cash = $2,
           expected_transfer = $3,
           expected_pos = $4,
           counted_cash = $5,
           counted_transfer = $6,
           counted_pos = $7,
           variance_cash = $8,
           variance_transfer = $9,
           variance_pos = $10,
           note = $11,
           closed_by_user_id = $12,
           updated_at = $13
       WHERE id = $14 AND tenant_id = $15 AND property_id = $16
       RETURNING id, tenant_id, property_id, date, status, expected_cash, expected_transfer, expected_pos,
                 counted_cash, counted_transfer, counted_pos, variance_cash, variance_transfer, variance_pos,
                 note, closed_by_user_id, created_at, updated_at`,
      [
        report.status,
        report.expectedCash,
        report.expectedTransfer,
        report.expectedPos,
        report.countedCash,
        report.countedTransfer,
        report.countedPos,
        report.varianceCash,
        report.varianceTransfer,
        report.variancePos,
        report.note ?? null,
        report.closedByUserId,
        report.updatedAt,
        report.id,
        report.tenantId,
        report.propertyId,
      ],
    );

    return this.mapDailyCloseReport(result.rows[0]);
  }

  async enqueue(
    queue: string,
    name: string,
    payload: Record<string, unknown>,
  ): Promise<QueueJobRecord> {
    const id = randomUUID();
    const result = await this.postgres.query(
      `INSERT INTO queue_jobs (id, queue, name, payload)
       VALUES ($1, $2, $3, $4::jsonb)
       RETURNING id, queue, name, payload, created_at`,
      [id, queue, name, JSON.stringify(payload)],
    );

    return {
      id: result.rows[0].id,
      queue: result.rows[0].queue,
      name: result.rows[0].name,
      payload: result.rows[0].payload,
      createdAt: this.toIso(result.rows[0].created_at),
    };
  }

  async listQueueJobs(query?: {
    queue?: string;
    name?: string;
    from?: string;
    to?: string;
    limit?: number;
  }): Promise<QueueJobRecord[]> {
    const params: unknown[] = [];
    let whereClause = '1=1';

    if (query?.queue) {
      params.push(query.queue);
      whereClause += ` AND queue = $${params.length}`;
    }

    if (query?.name) {
      params.push(query.name);
      whereClause += ` AND name = $${params.length}`;
    }

    if (query?.from) {
      params.push(query.from);
      whereClause += ` AND created_at >= $${params.length}`;
    }

    if (query?.to) {
      params.push(query.to);
      whereClause += ` AND created_at <= $${params.length}`;
    }

    params.push(query?.limit ?? 100);
    const result = await this.postgres.query(
      `SELECT id, queue, name, payload, created_at
       FROM queue_jobs
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.length}`,
      params,
    );

    return result.rows.map((row) => ({
      id: String(row.id),
      queue: String(row.queue),
      name: String(row.name),
      payload:
        typeof row.payload === 'object' && row.payload !== null
          ? (row.payload as Record<string, unknown>)
          : {},
      createdAt: this.toIso(row.created_at),
    }));
  }

  async createAuditLog(input: CreateAuditLogInput): Promise<AuditLogRecord> {
    const log = input.auditLog;
    const result = await this.postgres.query(
      `INSERT INTO audit_logs (
          id, tenant_id, property_id, actor_user_id, actor_role, action, entity_type,
          entity_id, before_json, after_json, ip_address, user_agent, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9::jsonb, $10::jsonb, $11, $12, $13
        )
        RETURNING id, tenant_id, property_id, actor_user_id, actor_role, action, entity_type,
                  entity_id, before_json, after_json, ip_address, user_agent, created_at`,
      [
        log.id,
        log.tenantId,
        log.propertyId ?? null,
        log.actorUserId ?? null,
        log.actorRole ?? null,
        log.action,
        log.entityType,
        log.entityId,
        JSON.stringify(log.beforeJson ?? null),
        JSON.stringify(log.afterJson ?? null),
        log.ipAddress ?? null,
        log.userAgent ?? null,
        log.createdAt,
      ],
    );

    return this.mapAuditLog(result.rows[0]);
  }

  async listAuditLogs(query: {
    tenantId: string;
    propertyId: string;
    from?: string;
    to?: string;
    actorUserId?: string;
    action?: string;
    entityType?: string;
    limit?: number;
  }): Promise<AuditLogRecord[]> {
    const params: unknown[] = [query.tenantId, query.propertyId];
    let whereClause = 'tenant_id = $1 AND property_id = $2';

    if (query.from) {
      params.push(query.from);
      whereClause += ` AND created_at >= $${params.length}`;
    }

    if (query.to) {
      params.push(query.to);
      whereClause += ` AND created_at <= $${params.length}`;
    }

    if (query.actorUserId) {
      params.push(query.actorUserId);
      whereClause += ` AND actor_user_id = $${params.length}`;
    }

    if (query.action) {
      params.push(query.action);
      whereClause += ` AND action = $${params.length}`;
    }

    if (query.entityType) {
      params.push(query.entityType);
      whereClause += ` AND entity_type = $${params.length}`;
    }

    params.push(query.limit ?? 100);
    const result = await this.postgres.query(
      `SELECT id, tenant_id, property_id, actor_user_id, actor_role, action, entity_type,
              entity_id, before_json, after_json, ip_address, user_agent, created_at
       FROM audit_logs
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.length}`,
      params,
    );

    return result.rows.map((row) => this.mapAuditLog(row));
  }

  async listAuditLogsByTenant(query: {
    tenantId: string;
    propertyIds?: string[];
    from?: string;
    to?: string;
    actorUserId?: string;
    action?: string;
    entityType?: string;
    limit?: number;
  }): Promise<AuditLogRecord[]> {
    const params: unknown[] = [query.tenantId];
    let whereClause = 'tenant_id = $1';

    if (query.propertyIds?.length) {
      params.push(query.propertyIds);
      whereClause += ` AND property_id = ANY($${params.length}::uuid[])`;
    }

    if (query.from) {
      params.push(query.from);
      whereClause += ` AND created_at >= $${params.length}`;
    }

    if (query.to) {
      params.push(query.to);
      whereClause += ` AND created_at <= $${params.length}`;
    }

    if (query.actorUserId) {
      params.push(query.actorUserId);
      whereClause += ` AND actor_user_id = $${params.length}`;
    }

    if (query.action) {
      params.push(query.action);
      whereClause += ` AND action = $${params.length}`;
    }

    if (query.entityType) {
      params.push(query.entityType);
      whereClause += ` AND entity_type = $${params.length}`;
    }

    params.push(query.limit ?? 100);
    const result = await this.postgres.query(
      `SELECT id, tenant_id, property_id, actor_user_id, actor_role, action, entity_type,
              entity_id, before_json, after_json, ip_address, user_agent, created_at
       FROM audit_logs
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.length}`,
      params,
    );

    return result.rows.map((row) => this.mapAuditLog(row));
  }

  async listAuditLogsGlobal(query: {
    tenantIds?: string[];
    from?: string;
    to?: string;
    actorUserId?: string;
    action?: string;
    entityType?: string;
    limit?: number;
  }): Promise<AuditLogRecord[]> {
    const params: unknown[] = [];
    let whereClause = '1=1';

    if (query.tenantIds?.length) {
      params.push(query.tenantIds);
      whereClause += ` AND tenant_id = ANY($${params.length}::uuid[])`;
    }

    if (query.from) {
      params.push(query.from);
      whereClause += ` AND created_at >= $${params.length}`;
    }

    if (query.to) {
      params.push(query.to);
      whereClause += ` AND created_at <= $${params.length}`;
    }

    if (query.actorUserId) {
      params.push(query.actorUserId);
      whereClause += ` AND actor_user_id = $${params.length}`;
    }

    if (query.action) {
      params.push(query.action);
      whereClause += ` AND action = $${params.length}`;
    }

    if (query.entityType) {
      params.push(query.entityType);
      whereClause += ` AND entity_type = $${params.length}`;
    }

    params.push(query.limit ?? 100);
    const result = await this.postgres.query(
      `SELECT id, tenant_id, property_id, actor_user_id, actor_role, action, entity_type,
              entity_id, before_json, after_json, ip_address, user_agent, created_at
       FROM audit_logs
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.length}`,
      params,
    );

    return result.rows.map((row) => this.mapAuditLog(row));
  }

  async createOwnerException(input: CreateOwnerExceptionInput): Promise<OwnerExceptionRecord> {
    const exception = input.exception;
    const result = await this.postgres.query(
      `INSERT INTO owner_exceptions (
          id, tenant_id, property_id, type, severity, source_action, actor_user_id,
          entity_type, entity_id, summary, metadata_json, acknowledged_by_user_id,
          acknowledged_at, dedupe_key, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11::jsonb, $12,
          $13, $14, $15, $16
        )
        ON CONFLICT (tenant_id, dedupe_key)
        WHERE dedupe_key IS NOT NULL
        DO UPDATE SET updated_at = EXCLUDED.updated_at
        RETURNING id, tenant_id, property_id, type, severity, source_action, actor_user_id,
                  entity_type, entity_id, summary, metadata_json, acknowledged_by_user_id,
                  acknowledged_at, dedupe_key, created_at, updated_at`,
      [
        exception.id,
        exception.tenantId,
        exception.propertyId ?? null,
        exception.type,
        exception.severity,
        exception.sourceAction,
        exception.actorUserId ?? null,
        exception.entityType,
        exception.entityId,
        exception.summary,
        JSON.stringify(exception.metadataJson ?? {}),
        exception.acknowledgedByUserId ?? null,
        exception.acknowledgedAt ?? null,
        exception.dedupeKey ?? null,
        exception.createdAt,
        exception.updatedAt,
      ],
    );

    return this.mapOwnerException(result.rows[0]);
  }

  async listOwnerExceptions(query: {
    tenantId: string;
    propertyIds?: string[];
    type?: string;
    severity?: string;
    from?: string;
    to?: string;
    acknowledged?: boolean;
    limit?: number;
  }): Promise<OwnerExceptionRecord[]> {
    const params: unknown[] = [query.tenantId];
    let whereClause = 'tenant_id = $1';

    if (query.propertyIds?.length) {
      params.push(query.propertyIds);
      whereClause += ` AND property_id = ANY($${params.length}::uuid[])`;
    }

    if (query.type) {
      params.push(query.type);
      whereClause += ` AND type = $${params.length}`;
    }

    if (query.severity) {
      params.push(query.severity);
      whereClause += ` AND severity = $${params.length}`;
    }

    if (query.from) {
      params.push(query.from);
      whereClause += ` AND created_at >= $${params.length}`;
    }

    if (query.to) {
      params.push(query.to);
      whereClause += ` AND created_at <= $${params.length}`;
    }

    if (query.acknowledged === true) {
      whereClause += ' AND acknowledged_at IS NOT NULL';
    }

    if (query.acknowledged === false) {
      whereClause += ' AND acknowledged_at IS NULL';
    }

    params.push(query.limit ?? 200);
    const result = await this.postgres.query(
      `SELECT id, tenant_id, property_id, type, severity, source_action, actor_user_id,
              entity_type, entity_id, summary, metadata_json, acknowledged_by_user_id,
              acknowledged_at, dedupe_key, created_at, updated_at
       FROM owner_exceptions
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.length}`,
      params,
    );

    return result.rows.map((row) => this.mapOwnerException(row));
  }

  async getOwnerException(query: {
    tenantId: string;
    exceptionId: string;
  }): Promise<OwnerExceptionRecord | undefined> {
    const result = await this.postgres.query(
      `SELECT id, tenant_id, property_id, type, severity, source_action, actor_user_id,
              entity_type, entity_id, summary, metadata_json, acknowledged_by_user_id,
              acknowledged_at, dedupe_key, created_at, updated_at
       FROM owner_exceptions
       WHERE tenant_id = $1 AND id = $2
       LIMIT 1`,
      [query.tenantId, query.exceptionId],
    );

    if (!result.rowCount) {
      return undefined;
    }

    return this.mapOwnerException(result.rows[0]);
  }

  async updateOwnerException(input: UpdateOwnerExceptionInput): Promise<OwnerExceptionRecord> {
    const exception = input.exception;
    const result = await this.postgres.query(
      `UPDATE owner_exceptions
       SET property_id = $1,
           type = $2,
           severity = $3,
           source_action = $4,
           actor_user_id = $5,
           entity_type = $6,
           entity_id = $7,
           summary = $8,
           metadata_json = $9::jsonb,
           acknowledged_by_user_id = $10,
           acknowledged_at = $11,
           dedupe_key = $12,
           updated_at = $13
       WHERE id = $14 AND tenant_id = $15
       RETURNING id, tenant_id, property_id, type, severity, source_action, actor_user_id,
                 entity_type, entity_id, summary, metadata_json, acknowledged_by_user_id,
                 acknowledged_at, dedupe_key, created_at, updated_at`,
      [
        exception.propertyId ?? null,
        exception.type,
        exception.severity,
        exception.sourceAction,
        exception.actorUserId ?? null,
        exception.entityType,
        exception.entityId,
        exception.summary,
        JSON.stringify(exception.metadataJson ?? {}),
        exception.acknowledgedByUserId ?? null,
        exception.acknowledgedAt ?? null,
        exception.dedupeKey ?? null,
        exception.updatedAt,
        exception.id,
        exception.tenantId,
      ],
    );

    return this.mapOwnerException(result.rows[0]);
  }

  async createOwnerNote(input: CreateOwnerNoteInput): Promise<OwnerNoteRecord> {
    const note = input.note;
    const result = await this.postgres.query(
      `INSERT INTO owner_notes (
          id, tenant_id, property_id, exception_id, text, created_by_user_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, tenant_id, property_id, exception_id, text, created_by_user_id, created_at`,
      [
        note.id,
        note.tenantId,
        note.propertyId ?? null,
        note.exceptionId,
        note.text,
        note.createdByUserId,
        note.createdAt,
      ],
    );

    return this.mapOwnerNote(result.rows[0]);
  }

  async listOwnerNotes(query: {
    tenantId: string;
    exceptionId?: string;
    propertyIds?: string[];
    limit?: number;
  }): Promise<OwnerNoteRecord[]> {
    const params: unknown[] = [query.tenantId];
    let whereClause = 'tenant_id = $1';

    if (query.exceptionId) {
      params.push(query.exceptionId);
      whereClause += ` AND exception_id = $${params.length}`;
    }

    if (query.propertyIds?.length) {
      params.push(query.propertyIds);
      whereClause += ` AND property_id = ANY($${params.length}::uuid[])`;
    }

    params.push(query.limit ?? 200);
    const result = await this.postgres.query(
      `SELECT id, tenant_id, property_id, exception_id, text, created_by_user_id, created_at
       FROM owner_notes
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.length}`,
      params,
    );

    return result.rows.map((row) => this.mapOwnerNote(row));
  }

  async createOwnerExportJob(input: CreateOwnerExportJobInput): Promise<OwnerExportJobRecord> {
    const exportJob = input.exportJob;
    const result = await this.postgres.query(
      `INSERT INTO owner_export_jobs (
          id, tenant_id, requested_by_user_id, export_type, format, from_date, to_date,
          property_ids, filters_json, status, download_url, error_message, created_at,
          updated_at, completed_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8::uuid[], $9::jsonb, $10, $11, $12, $13,
          $14, $15
        )
        RETURNING id, tenant_id, requested_by_user_id, export_type, format, from_date, to_date,
                  property_ids, filters_json, status, download_url, error_message, created_at,
                  updated_at, completed_at`,
      [
        exportJob.id,
        exportJob.tenantId,
        exportJob.requestedByUserId,
        exportJob.exportType,
        exportJob.format,
        exportJob.fromDate,
        exportJob.toDate,
        exportJob.propertyIds,
        JSON.stringify(exportJob.filtersJson ?? {}),
        exportJob.status,
        exportJob.downloadUrl ?? null,
        exportJob.errorMessage ?? null,
        exportJob.createdAt,
        exportJob.updatedAt,
        exportJob.completedAt ?? null,
      ],
    );

    return this.mapOwnerExportJob(result.rows[0]);
  }

  async listOwnerExportJobs(query: {
    tenantId: string;
    requestedByUserId?: string;
    status?: string;
    limit?: number;
  }): Promise<OwnerExportJobRecord[]> {
    const params: unknown[] = [query.tenantId];
    let whereClause = 'tenant_id = $1';

    if (query.requestedByUserId) {
      params.push(query.requestedByUserId);
      whereClause += ` AND requested_by_user_id = $${params.length}`;
    }

    if (query.status) {
      params.push(query.status);
      whereClause += ` AND status = $${params.length}`;
    }

    params.push(query.limit ?? 100);
    const result = await this.postgres.query(
      `SELECT id, tenant_id, requested_by_user_id, export_type, format, from_date, to_date,
              property_ids, filters_json, status, download_url, error_message, created_at,
              updated_at, completed_at
       FROM owner_export_jobs
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.length}`,
      params,
    );

    return result.rows.map((row) => this.mapOwnerExportJob(row));
  }

  async getOwnerExportJob(query: {
    tenantId: string;
    exportJobId: string;
  }): Promise<OwnerExportJobRecord | undefined> {
    const result = await this.postgres.query(
      `SELECT id, tenant_id, requested_by_user_id, export_type, format, from_date, to_date,
              property_ids, filters_json, status, download_url, error_message, created_at,
              updated_at, completed_at
       FROM owner_export_jobs
       WHERE tenant_id = $1 AND id = $2
       LIMIT 1`,
      [query.tenantId, query.exportJobId],
    );

    if (!result.rowCount) {
      return undefined;
    }

    return this.mapOwnerExportJob(result.rows[0]);
  }

  async updateOwnerExportJob(input: UpdateOwnerExportJobInput): Promise<OwnerExportJobRecord> {
    const exportJob = input.exportJob;
    const result = await this.postgres.query(
      `UPDATE owner_export_jobs
       SET export_type = $1,
           format = $2,
           from_date = $3,
           to_date = $4,
           property_ids = $5::uuid[],
           filters_json = $6::jsonb,
           status = $7,
           download_url = $8,
           error_message = $9,
           updated_at = $10,
           completed_at = $11
       WHERE id = $12 AND tenant_id = $13
       RETURNING id, tenant_id, requested_by_user_id, export_type, format, from_date, to_date,
                 property_ids, filters_json, status, download_url, error_message, created_at,
                 updated_at, completed_at`,
      [
        exportJob.exportType,
        exportJob.format,
        exportJob.fromDate,
        exportJob.toDate,
        exportJob.propertyIds,
        JSON.stringify(exportJob.filtersJson ?? {}),
        exportJob.status,
        exportJob.downloadUrl ?? null,
        exportJob.errorMessage ?? null,
        exportJob.updatedAt,
        exportJob.completedAt ?? null,
        exportJob.id,
        exportJob.tenantId,
      ],
    );

    return this.mapOwnerExportJob(result.rows[0]);
  }

  buildIdempotencyCacheKey(input: IdempotencyKeyInput): string {
    return [
      input.tenantId,
      input.propertyId ?? 'global',
      input.userId,
      input.method.toUpperCase(),
      input.path,
      input.idempotencyKey,
    ].join(':');
  }

  async getIdempotentResponse(cacheKey: string): Promise<IdempotentResponse | undefined> {
    const result = await this.postgres.query(
      `SELECT status_code, response_json
       FROM idempotency_keys
       WHERE cache_key = $1
       LIMIT 1`,
      [cacheKey],
    );

    if (!result.rowCount) {
      return undefined;
    }

    return {
      statusCode: Number(result.rows[0].status_code),
      body: result.rows[0].response_json,
    };
  }

  async setIdempotentResponse(cacheKey: string, response: IdempotentResponse): Promise<void> {
    await this.postgres.query(
      `INSERT INTO idempotency_keys (cache_key, status_code, response_json)
       VALUES ($1, $2, $3::jsonb)
       ON CONFLICT (cache_key)
       DO UPDATE SET status_code = EXCLUDED.status_code,
                     response_json = EXCLUDED.response_json,
                     updated_at = NOW()`,
      [cacheKey, response.statusCode, JSON.stringify(response.body ?? null)],
    );
  }

  private mapTenant(row: Record<string, unknown>): TenantRecord {
    return {
      id: String(row.id),
      name: String(row.name),
      legalName: this.toNullableString(row.legal_name),
      primaryPhone: this.toNullableString(row.primary_phone),
      primaryEmail: this.toNullableString(row.primary_email),
      country: this.toNullableString(row.country),
      state: this.toNullableString(row.state),
      city: this.toNullableString(row.city),
      timezone: String(row.timezone),
      status: row.status as TenantRecord['status'],
      createdAt: this.toNullableIso(row.created_at),
      updatedAt: this.toNullableIso(row.updated_at),
    };
  }

  private mapUser(row: Record<string, unknown>): UserRecord {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      fullName: String(row.full_name),
      phone: this.toNullableString(row.phone),
      email: this.toNullableString(row.email),
      passwordHash: this.toNullableString(row.password_hash),
      authProvider: row.auth_provider as UserRecord['authProvider'],
      status: row.status as UserRecord['status'],
      lastLoginAt: this.toNullableIso(row.last_login_at),
      createdAt: this.toIso(row.created_at),
      updatedAt: this.toIso(row.updated_at),
    };
  }

  private mapUserPropertyAccess(
    row: Record<string, unknown>,
  ): UserPropertyAccessRecord {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      userId: String(row.user_id),
      propertyId: String(row.property_id),
      accessLevel: String(row.access_level),
      createdAt: this.toIso(row.created_at),
      updatedAt: this.toIso(row.updated_at),
    };
  }

  private mapSubscriptionPlan(row: Record<string, unknown>): SubscriptionPlanRecord {
    return {
      id: String(row.id),
      code: String(row.code) as SubscriptionPlanRecord['code'],
      name: String(row.name),
      description: this.toNullableString(row.description),
      propertyLimit: Number(row.property_limit),
      userLimit: Number(row.user_limit),
      featuresJson:
        typeof row.features_json === 'object' && row.features_json !== null
          ? (row.features_json as Record<string, unknown>)
          : {},
      isActive: Boolean(row.is_active),
      createdAt: this.toIso(row.created_at),
      updatedAt: this.toIso(row.updated_at),
    };
  }

  private mapTenantSubscription(row: Record<string, unknown>): TenantSubscriptionRecord {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      subscriptionPlanId: String(row.subscription_plan_id),
      effectiveFrom: this.toIsoDate(row.effective_from),
      effectiveTo: this.toNullableIsoDate(row.effective_to),
      status: String(row.status) as TenantSubscriptionRecord['status'],
      createdByUserId: String(row.created_by_user_id),
      createdAt: this.toIso(row.created_at),
      updatedAt: this.toIso(row.updated_at),
    };
  }

  private mapTenantFeatureFlag(row: Record<string, unknown>): TenantFeatureFlagRecord {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      key: String(row.key),
      enabled: Boolean(row.enabled),
      configJson:
        typeof row.config_json === 'object' && row.config_json !== null
          ? (row.config_json as Record<string, unknown>)
          : {},
      updatedByUserId: String(row.updated_by_user_id),
      createdAt: this.toIso(row.created_at),
      updatedAt: this.toIso(row.updated_at),
    };
  }

  private mapImpersonationSession(
    row: Record<string, unknown>,
  ): ImpersonationSessionRecord {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      targetUserId: String(row.target_user_id),
      token: String(row.token),
      status: String(row.status) as ImpersonationSessionRecord['status'],
      startedByUserId: String(row.started_by_user_id),
      startedAt: this.toIso(row.started_at),
      expiresAt: this.toIso(row.expires_at),
      endedAt: this.toNullableIso(row.ended_at),
      endedByUserId: this.toNullableString(row.ended_by_user_id),
      reason: this.toNullableString(row.reason),
    };
  }

  private mapGuest(row: Record<string, unknown>): GuestRecord {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      propertyId: String(row.property_id),
      fullName: String(row.full_name),
      phone: this.toNullableString(row.phone),
      email: this.toNullableString(row.email),
      notes: this.toNullableString(row.notes),
      createdAt: this.toIso(row.created_at),
      updatedAt: this.toIso(row.updated_at),
    };
  }

  private mapRoom(row: Record<string, unknown>): RoomRecord {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      propertyId: String(row.property_id),
      roomTypeId: String(row.room_type_id),
      roomNumber: String(row.room_number),
      status: row.status as RoomRecord['status'],
    };
  }

  private mapRatePlan(row: Record<string, unknown>): RatePlanRecord {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      propertyId: String(row.property_id),
      roomTypeId: String(row.room_type_id),
      name: String(row.name),
      baseRate: Number(row.base_rate),
      currency: String(row.currency),
      effectiveFrom: this.toIsoDate(row.effective_from),
      effectiveTo: this.toNullableIsoDate(row.effective_to),
      createdAt: this.toIso(row.created_at),
      updatedAt: this.toIso(row.updated_at),
    };
  }

  private mapMenuCategory(row: Record<string, unknown>): MenuCategoryRecord {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      propertyId: String(row.property_id),
      name: String(row.name),
      createdByUserId: String(row.created_by_user_id),
      updatedByUserId: this.toNullableString(row.updated_by_user_id),
      createdAt: this.toIso(row.created_at),
      updatedAt: this.toIso(row.updated_at),
    };
  }

  private mapMenuItem(row: Record<string, unknown>): MenuItemRecord {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      propertyId: String(row.property_id),
      categoryId: String(row.category_id),
      name: String(row.name),
      price: Number(row.price),
      active: Boolean(row.active),
      description: this.toNullableString(row.description),
      createdByUserId: String(row.created_by_user_id),
      updatedByUserId: this.toNullableString(row.updated_by_user_id),
      createdAt: this.toIso(row.created_at),
      updatedAt: this.toIso(row.updated_at),
    };
  }

  private mapKitchenOrder(row: Record<string, unknown>): KitchenOrderRecord {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      propertyId: String(row.property_id),
      code: String(row.code),
      stayId: String(row.stay_id),
      roomId: String(row.room_id),
      status: row.status as KitchenOrderRecord['status'],
      notes: this.toNullableString(row.notes),
      totalAmount: Number(row.total_amount),
      chargePostedAt: this.toNullableIso(row.charge_posted_at),
      chargeFolioLineItemId: this.toNullableString(row.charge_folio_line_item_id),
      cancelledReason: this.toNullableString(row.cancelled_reason),
      createdByUserId: String(row.created_by_user_id),
      updatedByUserId: this.toNullableString(row.updated_by_user_id),
      createdAt: this.toIso(row.created_at),
      updatedAt: this.toIso(row.updated_at),
    };
  }

  private mapKitchenOrderItem(row: Record<string, unknown>): KitchenOrderItemRecord {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      propertyId: String(row.property_id),
      orderId: String(row.order_id),
      menuItemId: String(row.menu_item_id),
      menuItemName: String(row.menu_item_name),
      quantity: Number(row.quantity),
      unitPrice: Number(row.unit_price),
      lineTotal: Number(row.line_total),
      itemNote: this.toNullableString(row.item_note),
      createdAt: this.toIso(row.created_at),
      updatedAt: this.toIso(row.updated_at),
    };
  }

  private mapReservation(row: Record<string, unknown>): ReservationRecord {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      propertyId: String(row.property_id),
      code: String(row.code),
      guestId: String(row.guest_id),
      guestFullName: String(row.guest_full_name),
      guestPhone: this.toNullableString(row.guest_phone),
      roomTypeId: String(row.room_type_id),
      checkIn: this.toIsoDate(row.check_in),
      checkOut: this.toIsoDate(row.check_out),
      adults: Number(row.adults),
      children: Number(row.children),
      source: row.source as ReservationRecord['source'],
      notes: this.toNullableString(row.notes),
      noPhone: Boolean(row.no_phone),
      depositStatus: row.deposit_status as ReservationRecord['depositStatus'],
      status: row.status as ReservationRecord['status'],
      cancelReason: this.toNullableString(row.cancel_reason),
      cancelNotes: this.toNullableString(row.cancel_notes),
      createdAt: this.toIso(row.created_at),
      updatedAt: this.toIso(row.updated_at),
    };
  }

  private mapStay(row: Record<string, unknown>): StayRecord {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      propertyId: String(row.property_id),
      reservationId: String(row.reservation_id),
      guestId: String(row.guest_id),
      roomId: this.toNullableString(row.room_id),
      idNumber: this.toNullableString(row.id_number),
      status: row.status as StayRecord['status'],
      checkInAt: this.toIso(row.check_in_at),
      plannedCheckOut: this.toIsoDate(row.planned_check_out),
      checkOutAt: this.toNullableIso(row.check_out_at),
      notes: this.toNullableString(row.notes),
      createdAt: this.toIso(row.created_at),
      updatedAt: this.toIso(row.updated_at),
    };
  }

  private mapHousekeepingTask(row: Record<string, unknown>): HousekeepingTaskRecord {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      propertyId: String(row.property_id),
      roomId: String(row.room_id),
      stayId: this.toNullableString(row.stay_id),
      status: row.status as HousekeepingTaskRecord['status'],
      assignedUserId: this.toNullableString(row.assigned_user_id),
      note: String(row.note),
      createdAt: this.toIso(row.created_at),
      updatedAt: this.toIso(row.updated_at),
      completedAt: this.toNullableIso(row.completed_at),
    };
  }

  private mapMaintenanceTicket(row: Record<string, unknown>): MaintenanceTicketRecord {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      propertyId: String(row.property_id),
      roomId: String(row.room_id),
      title: String(row.title),
      description: String(row.description),
      severity: row.severity as MaintenanceTicketRecord['severity'],
      status: row.status as MaintenanceTicketRecord['status'],
      photoUrl: this.toNullableString(row.photo_url),
      reportedByUserId: String(row.reported_by_user_id),
      resolvedByUserId: this.toNullableString(row.resolved_by_user_id),
      createdAt: this.toIso(row.created_at),
      updatedAt: this.toIso(row.updated_at),
      resolvedAt: this.toNullableIso(row.resolved_at),
    };
  }

  private mapShiftHandover(row: Record<string, unknown>): ShiftHandoverRecord {
    const exceptions = Array.isArray(row.exceptions)
      ? (row.exceptions as string[])
      : typeof row.exceptions === 'string'
        ? (JSON.parse(row.exceptions) as string[])
        : [];

    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      propertyId: String(row.property_id),
      userId: String(row.user_id),
      shiftType: row.shift_type as ShiftHandoverRecord['shiftType'],
      notes: String(row.notes),
      exceptions,
      createdAt: this.toIso(row.created_at),
    };
  }

  private mapConfirmation(row: Record<string, unknown>): ConfirmationRecord {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      propertyId: String(row.property_id),
      entityType: row.entity_type as ConfirmationRecord['entityType'],
      entityId: String(row.entity_id),
      template: String(row.template),
      channel: String(row.channel),
      toPhone: this.toNullableString(row.to_phone),
      language: this.toNullableString(row.language),
      status: row.status as ConfirmationRecord['status'],
      createdAt: this.toIso(row.created_at),
    };
  }

  private mapDiscountRequest(row: Record<string, unknown>): DiscountRequestRecord {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      propertyId: String(row.property_id),
      entityType: row.entity_type as ApprovalEntityType.RESERVATION | ApprovalEntityType.STAY,
      entityId: String(row.entity_id),
      discountType: row.discount_type as DiscountType,
      value: Number(row.value),
      reason: String(row.reason),
      status: row.status as ApprovalStatus,
      requestedByUserId: String(row.requested_by_user_id),
      approvedByUserId: this.toNullableString(row.approved_by_user_id),
      rejectedByUserId: this.toNullableString(row.rejected_by_user_id),
      note: this.toNullableString(row.note),
      rejectionReason: this.toNullableString(row.rejection_reason),
      appliedLineItemId: this.toNullableString(row.applied_line_item_id),
      createdAt: this.toIso(row.created_at),
      updatedAt: this.toIso(row.updated_at),
    };
  }

  private mapRefundRequest(row: Record<string, unknown>): RefundRequestRecord {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      propertyId: String(row.property_id),
      invoiceId: String(row.invoice_id),
      amount: Number(row.amount),
      reason: String(row.reason),
      status: row.status as ApprovalStatus,
      requestedByUserId: String(row.requested_by_user_id),
      approvedByUserId: this.toNullableString(row.approved_by_user_id),
      rejectedByUserId: this.toNullableString(row.rejected_by_user_id),
      note: this.toNullableString(row.note),
      rejectionReason: this.toNullableString(row.rejection_reason),
      createdAt: this.toIso(row.created_at),
      updatedAt: this.toIso(row.updated_at),
    };
  }

  private mapOverrideRequest(row: Record<string, unknown>): OverrideRequestRecord {
    const requestedValue =
      typeof row.requested_value === 'object' && row.requested_value !== null
        ? (row.requested_value as Record<string, unknown>)
        : undefined;

    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      propertyId: String(row.property_id),
      overrideType: row.override_type as OverrideType,
      entityType: row.entity_type as ApprovalEntityType,
      entityId: String(row.entity_id),
      reason: String(row.reason),
      requestedValue,
      status: row.status as ApprovalStatus,
      requestedByUserId: String(row.requested_by_user_id),
      approvedByUserId: this.toNullableString(row.approved_by_user_id),
      rejectedByUserId: this.toNullableString(row.rejected_by_user_id),
      note: this.toNullableString(row.note),
      rejectionReason: this.toNullableString(row.rejection_reason),
      overrideToken: this.toNullableString(row.override_token),
      overrideTokenExpiresAt: this.toNullableIso(row.override_token_expires_at),
      createdAt: this.toIso(row.created_at),
      updatedAt: this.toIso(row.updated_at),
    };
  }

  private mapInvoice(row: Record<string, unknown>): InvoiceRecord {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      propertyId: String(row.property_id),
      invoiceNumber: String(row.invoice_number),
      reservationId: this.toNullableString(row.reservation_id),
      stayId: this.toNullableString(row.stay_id),
      guestId: this.toNullableString(row.guest_id),
      issuedOn: this.toIsoDate(row.issued_on),
      currency: String(row.currency),
      status: row.status as InvoiceRecord['status'],
      createdAt: this.toIso(row.created_at),
      updatedAt: this.toIso(row.updated_at),
    };
  }

  private mapPayment(row: Record<string, unknown>): PaymentRecord {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      propertyId: String(row.property_id),
      invoiceId: String(row.invoice_id),
      method: row.method as PaymentMethod,
      amount: Number(row.amount),
      paymentType: row.payment_type as PaymentRecord['paymentType'],
      status: row.status as PaymentStatus,
      reference: this.toNullableString(row.reference),
      note: this.toNullableString(row.note),
      createdByUserId: String(row.created_by_user_id),
      createdAt: this.toIso(row.created_at),
      updatedAt: this.toIso(row.updated_at),
    };
  }

  private mapRefundExecution(row: Record<string, unknown>): RefundExecutionRecord {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      propertyId: String(row.property_id),
      refundRequestId: String(row.refund_request_id),
      paymentId: String(row.payment_id),
      method: row.method as PaymentMethod,
      amount: Number(row.amount),
      reference: this.toNullableString(row.reference),
      note: this.toNullableString(row.note),
      executedByUserId: String(row.executed_by_user_id),
      createdAt: this.toIso(row.created_at),
    };
  }

  private mapDailyCloseReport(row: Record<string, unknown>): DailyCloseReportRecord {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      propertyId: String(row.property_id),
      date: this.toIsoDate(row.date),
      status: row.status as DailyCloseStatus,
      expectedCash: Number(row.expected_cash),
      expectedTransfer: Number(row.expected_transfer),
      expectedPos: Number(row.expected_pos),
      countedCash: Number(row.counted_cash),
      countedTransfer: Number(row.counted_transfer),
      countedPos: Number(row.counted_pos),
      varianceCash: Number(row.variance_cash),
      varianceTransfer: Number(row.variance_transfer),
      variancePos: Number(row.variance_pos),
      note: this.toNullableString(row.note),
      closedByUserId: String(row.closed_by_user_id),
      createdAt: this.toIso(row.created_at),
      updatedAt: this.toIso(row.updated_at),
    };
  }

  private mapFinanceShiftHandover(
    row: Record<string, unknown>,
  ): FinanceShiftHandoverRecord {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      propertyId: String(row.property_id),
      userId: String(row.user_id),
      shiftType: row.shift_type as FinanceShiftHandoverRecord['shiftType'],
      cashOnHand: Number(row.cash_on_hand),
      pendingRefunds: this.toNullableNumber(row.pending_refunds) ?? 0,
      notes: String(row.notes),
      createdAt: this.toIso(row.created_at),
    };
  }

  private mapFolioLineItem(row: Record<string, unknown>): FolioLineItemRecord {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      propertyId: String(row.property_id),
      invoiceId: this.toNullableString(row.invoice_id),
      referenceOrderId: this.toNullableString(row.reference_order_id),
      entityType: row.entity_type as FolioLineItemRecord['entityType'],
      entityId: String(row.entity_id),
      lineType: row.line_type as FolioLineItemRecord['lineType'],
      amount: Number(row.amount),
      currency: String(row.currency),
      description: String(row.description),
      createdByUserId: String(row.created_by_user_id),
      createdAt: this.toIso(row.created_at),
    };
  }

  private mapInventoryBlock(row: Record<string, unknown>): InventoryBlockRecord {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      propertyId: String(row.property_id),
      roomTypeId: String(row.room_type_id),
      fromDate: this.toIsoDate(row.from_date),
      toDate: this.toIsoDate(row.to_date),
      unitsBlocked: Number(row.units_blocked),
      reason: String(row.reason),
      createdByUserId: String(row.created_by_user_id),
      createdAt: this.toIso(row.created_at),
    };
  }

  private mapInventoryOverride(row: Record<string, unknown>): InventoryOverrideRecord {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      propertyId: String(row.property_id),
      roomTypeId: String(row.room_type_id),
      date: this.toIsoDate(row.date),
      newAvailableUnits: Number(row.new_available_units),
      reason: String(row.reason),
      createdByUserId: String(row.created_by_user_id),
      createdAt: this.toIso(row.created_at),
    };
  }

  private mapDayControl(row: Record<string, unknown>): DayControlRecord {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      propertyId: String(row.property_id),
      date: this.toIsoDate(row.date),
      isLocked: Boolean(row.is_locked),
      unlockedByUserId: this.toNullableString(row.unlocked_by_user_id),
      unlockReason: this.toNullableString(row.unlock_reason),
      createdAt: this.toIso(row.created_at),
      updatedAt: this.toIso(row.updated_at),
    };
  }

  private mapAuditLog(row: Record<string, unknown>): AuditLogRecord {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      propertyId: this.toNullableString(row.property_id),
      actorUserId: this.toNullableString(row.actor_user_id),
      actorRole: this.toNullableString(row.actor_role),
      action: String(row.action),
      entityType: String(row.entity_type),
      entityId: String(row.entity_id),
      beforeJson: row.before_json,
      afterJson: row.after_json,
      ipAddress: this.toNullableString(row.ip_address),
      userAgent: this.toNullableString(row.user_agent),
      createdAt: this.toIso(row.created_at),
    };
  }

  private mapOwnerException(row: Record<string, unknown>): OwnerExceptionRecord {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      propertyId: this.toNullableString(row.property_id),
      type: String(row.type) as OwnerExceptionRecord['type'],
      severity: String(row.severity) as OwnerExceptionRecord['severity'],
      sourceAction: String(row.source_action),
      actorUserId: this.toNullableString(row.actor_user_id),
      entityType: String(row.entity_type),
      entityId: String(row.entity_id),
      summary: String(row.summary),
      metadataJson:
        typeof row.metadata_json === 'object' && row.metadata_json !== null
          ? (row.metadata_json as Record<string, unknown>)
          : {},
      acknowledgedByUserId: this.toNullableString(row.acknowledged_by_user_id),
      acknowledgedAt: this.toNullableIso(row.acknowledged_at),
      dedupeKey: this.toNullableString(row.dedupe_key),
      createdAt: this.toIso(row.created_at),
      updatedAt: this.toIso(row.updated_at),
    };
  }

  private mapOwnerNote(row: Record<string, unknown>): OwnerNoteRecord {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      propertyId: this.toNullableString(row.property_id),
      exceptionId: String(row.exception_id),
      text: String(row.text),
      createdByUserId: String(row.created_by_user_id),
      createdAt: this.toIso(row.created_at),
    };
  }

  private mapOwnerExportJob(row: Record<string, unknown>): OwnerExportJobRecord {
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      requestedByUserId: String(row.requested_by_user_id),
      exportType: String(row.export_type) as OwnerExportJobRecord['exportType'],
      format: String(row.format) as OwnerExportJobRecord['format'],
      fromDate: this.toIsoDate(row.from_date),
      toDate: this.toIsoDate(row.to_date),
      propertyIds: Array.isArray(row.property_ids)
        ? row.property_ids.map((propertyId) => String(propertyId))
        : [],
      filtersJson:
        typeof row.filters_json === 'object' && row.filters_json !== null
          ? (row.filters_json as Record<string, unknown>)
          : {},
      status: String(row.status) as OwnerExportJobRecord['status'],
      downloadUrl: this.toNullableString(row.download_url),
      errorMessage: this.toNullableString(row.error_message),
      createdAt: this.toIso(row.created_at),
      updatedAt: this.toIso(row.updated_at),
      completedAt: this.toNullableIso(row.completed_at),
    };
  }

  private toIso(value: unknown): string {
    if (value instanceof Date) {
      return value.toISOString();
    }

    return String(value);
  }

  private toIsoDate(value: unknown): string {
    if (value instanceof Date) {
      const year = value.getFullYear().toString().padStart(4, '0');
      const month = (value.getMonth() + 1).toString().padStart(2, '0');
      const day = value.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    return String(value).slice(0, 10);
  }

  private toNullableIso(value: unknown): string | undefined {
    if (value == null) {
      return undefined;
    }

    return this.toIso(value);
  }

  private toNullableIsoDate(value: unknown): string | undefined {
    if (value == null) {
      return undefined;
    }

    return this.toIsoDate(value);
  }

  private toNullableString(value: unknown): string | undefined {
    if (value == null) {
      return undefined;
    }

    return String(value);
  }

  private toNullableNumber(value: unknown): number | undefined {
    if (value == null) {
      return undefined;
    }

    return Number(value);
  }
}
