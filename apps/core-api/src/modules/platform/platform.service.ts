import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ImpersonationStatus,
  PlatformAdminEvents,
  SubscriptionPlanCode,
} from '@meshva/contracts';
import { randomUUID } from 'crypto';
import { AppRequest, RequestContext } from '../../common/types/request-context';
import { AuditService } from '../audit/audit.service';
import {
  FRONT_DESK_REPOSITORY,
  FrontDeskRepository,
} from '../persistence/repositories/front-desk.repository';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { EndImpersonationDto } from './dto/end-impersonation.dto';
import { ImpersonateTenantDto } from './dto/impersonate-tenant.dto';
import { ListTenantsDto } from './dto/list-tenants.dto';
import { PlatformAuditQueryDto } from './dto/platform-audit-query.dto';
import { ResetUserPasswordDto } from './dto/reset-user-password.dto';
import { SuspendTenantDto } from './dto/suspend-tenant.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import { AssignPlanDto } from './dto/assign-plan.dto';
import { UpsertFeatureFlagDto } from './dto/upsert-feature-flag.dto';

@Injectable()
export class PlatformService {
  constructor(
    @Inject(FRONT_DESK_REPOSITORY)
    private readonly repository: FrontDeskRepository,
    private readonly auditService: AuditService,
  ) {}

  async listTenants(query: ListTenantsDto) {
    const [tenants, plans] = await Promise.all([
      this.repository.listTenants({ status: query.status }),
      this.repository.listSubscriptionPlans({ isActive: true }),
    ]);
    const plansById = new Map(plans.map((plan) => [plan.id, plan]));

    const rows = await Promise.all(
      tenants.map(async (tenant) => {
        const [properties, activeSubscription] = await Promise.all([
          this.repository.listPropertiesByTenant(tenant.id),
          this.repository.getActiveTenantSubscription(tenant.id),
        ]);
        const plan = activeSubscription
          ? plansById.get(activeSubscription.subscriptionPlanId)
          : undefined;

        return {
          ...tenant,
          propertiesCount: properties.length,
          activePlan: plan
            ? {
                id: plan.id,
                code: plan.code,
                name: plan.name,
              }
            : null,
        };
      }),
    );

    return {
      count: rows.length,
      rows,
    };
  }

  async getTenantDetails(tenantId: string) {
    const tenant = await this.getTenantOrThrow(tenantId);
    const [properties, users, activeSubscription, featureFlags] = await Promise.all([
      this.repository.listPropertiesByTenant(tenantId),
      this.repository.listUsersByTenant({ tenantId }),
      this.repository.getActiveTenantSubscription(tenantId),
      this.repository.listTenantFeatureFlags(tenantId),
    ]);

    return {
      tenant,
      properties,
      users,
      activeSubscription,
      featureFlags,
    };
  }

  async createTenant(request: AppRequest, dto: CreateTenantDto) {
    const plan = await this.repository.getSubscriptionPlanById(dto.subscriptionPlanId);
    if (!plan || !plan.isActive) {
      throw new BadRequestException('Subscription plan not found or inactive');
    }

    if (plan.propertyLimit < 1) {
      throw new BadRequestException('Selected plan does not support property onboarding');
    }

    const now = new Date().toISOString();
    const tenantId = randomUUID();
    const propertyId = randomUUID();
    const ownerUserId = randomUUID();

    const tenant = await this.repository.createTenant({
      tenant: {
        id: tenantId,
        name: dto.name,
        primaryEmail: dto.contactEmail,
        primaryPhone: dto.contactPhone,
        country: dto.country,
        state: dto.state,
        city: dto.city ?? dto.state,
        timezone: dto.timezone,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      },
    });

    const property = await this.repository.createProperty({
      property: {
        id: propertyId,
        tenantId,
        name: dto.initialPropertyName,
        state: dto.state,
        city: dto.city ?? dto.state,
        status: 'active',
      },
    });

    const ownerUser = await this.repository.createUser({
      user: {
        id: ownerUserId,
        tenantId,
        fullName: dto.initialOwner.fullName,
        phone: dto.initialOwner.phone,
        email: dto.initialOwner.email,
        authProvider: 'otp',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      },
    });

    await this.repository.upsertUserPropertyAccess({
      access: {
        id: randomUUID(),
        tenantId,
        userId: ownerUser.id,
        propertyId,
        accessLevel: 'manage',
        createdAt: now,
        updatedAt: now,
      },
    });

    await this.repository.createTenantSubscription({
      subscription: {
        id: randomUUID(),
        tenantId,
        subscriptionPlanId: plan.id,
        effectiveFrom: now.slice(0, 10),
        status: 'ACTIVE',
        createdByUserId: request.context.userId,
        createdAt: now,
        updatedAt: now,
      },
    });

    for (const [key, value] of Object.entries(plan.featuresJson ?? {})) {
      await this.repository.createTenantFeatureFlag({
        featureFlag: {
          id: randomUUID(),
          tenantId,
          key,
          enabled: Boolean(value),
          configJson: {},
          updatedByUserId: request.context.userId,
          createdAt: now,
          updatedAt: now,
        },
      });
    }

    await this.repository.enqueue('messaging', 'messaging.send', {
      tenantId,
      type: 'TENANT_ONBOARDING',
      ownerEmail: ownerUser.email,
      propertyName: property.name,
    });

    await this.auditService.recordMutation(this.toAuditContext(request.context, tenantId), {
      action: PlatformAdminEvents.TENANT_CREATED,
      entityType: 'Tenant',
      entityId: tenant.id,
      afterJson: {
        tenant,
        property,
        ownerUser,
        subscriptionPlanId: plan.id,
      },
    });

    return {
      tenant,
      property,
      ownerUser,
      plan: {
        id: plan.id,
        code: plan.code,
        name: plan.name,
      },
    };
  }

  async suspendTenant(tenantId: string, request: AppRequest, dto: SuspendTenantDto) {
    const tenant = await this.getTenantOrThrow(tenantId);
    if (tenant.status === 'suspended') {
      return tenant;
    }

    const before = { ...tenant };
    tenant.status = 'suspended';
    tenant.updatedAt = new Date().toISOString();
    const updated = await this.repository.updateTenant({ tenant });

    await this.auditService.recordMutation(this.toAuditContext(request.context, tenantId), {
      action: PlatformAdminEvents.TENANT_SUSPENDED,
      entityType: 'Tenant',
      entityId: tenantId,
      beforeJson: before,
      afterJson: {
        ...updated,
        reason: dto.reason,
      },
    });

    return updated;
  }

  async reactivateTenant(tenantId: string, request: AppRequest) {
    const tenant = await this.getTenantOrThrow(tenantId);
    if (tenant.status === 'active') {
      return tenant;
    }

    const before = { ...tenant };
    tenant.status = 'active';
    tenant.updatedAt = new Date().toISOString();
    const updated = await this.repository.updateTenant({ tenant });

    await this.auditService.recordMutation(this.toAuditContext(request.context, tenantId), {
      action: PlatformAdminEvents.TENANT_REACTIVATED,
      entityType: 'Tenant',
      entityId: tenantId,
      beforeJson: before,
      afterJson: updated,
    });

    return updated;
  }

  async listSubscriptionPlans() {
    return this.repository.listSubscriptionPlans();
  }

  async createSubscriptionPlan(request: AppRequest, dto: CreateSubscriptionPlanDto) {
    const now = new Date().toISOString();
    const plan = await this.repository.createSubscriptionPlan({
      plan: {
        id: randomUUID(),
        code: dto.code,
        name: dto.name,
        description: dto.description,
        propertyLimit: dto.propertyLimit,
        userLimit: dto.userLimit,
        featuresJson: dto.features ?? {},
        isActive: dto.isActive ?? true,
        createdAt: now,
        updatedAt: now,
      },
    });

    await this.auditService.recordMutation(this.toAuditContext(request.context), {
      action: PlatformAdminEvents.TENANT_PLAN_CHANGED,
      entityType: 'SubscriptionPlan',
      entityId: plan.id,
      afterJson: plan,
    });

    return plan;
  }

  async updateSubscriptionPlan(
    request: AppRequest,
    planId: string,
    dto: UpdateSubscriptionPlanDto,
  ) {
    const plan = await this.repository.getSubscriptionPlanById(planId);
    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    const before = { ...plan };
    plan.code = dto.code ?? plan.code;
    plan.name = dto.name ?? plan.name;
    plan.description = dto.description ?? plan.description;
    plan.propertyLimit = dto.propertyLimit ?? plan.propertyLimit;
    plan.userLimit = dto.userLimit ?? plan.userLimit;
    plan.featuresJson = dto.features ?? plan.featuresJson;
    plan.isActive = dto.isActive ?? plan.isActive;
    plan.updatedAt = new Date().toISOString();

    const updated = await this.repository.updateSubscriptionPlan({ plan });

    await this.auditService.recordMutation(this.toAuditContext(request.context), {
      action: PlatformAdminEvents.TENANT_PLAN_CHANGED,
      entityType: 'SubscriptionPlan',
      entityId: updated.id,
      beforeJson: before,
      afterJson: updated,
    });

    return updated;
  }

  async assignPlanToTenant(tenantId: string, request: AppRequest, dto: AssignPlanDto) {
    await this.getTenantOrThrow(tenantId);
    const plan = await this.repository.getSubscriptionPlanById(dto.subscriptionPlanId);
    if (!plan || !plan.isActive) {
      throw new BadRequestException('Subscription plan not found or inactive');
    }

    const properties = await this.repository.listPropertiesByTenant(tenantId);
    if (properties.length > plan.propertyLimit) {
      throw new BadRequestException(
        `Plan limit exceeded. Tenant has ${properties.length} properties but plan allows ${plan.propertyLimit}.`,
      );
    }

    const now = new Date().toISOString();
    const current = await this.repository.getActiveTenantSubscription(tenantId);
    if (current) {
      current.status = 'INACTIVE';
      current.effectiveTo = dto.effectiveFrom.slice(0, 10);
      current.updatedAt = now;
      await this.repository.updateTenantSubscription({ subscription: current });
    }

    const next = await this.repository.createTenantSubscription({
      subscription: {
        id: randomUUID(),
        tenantId,
        subscriptionPlanId: plan.id,
        effectiveFrom: dto.effectiveFrom.slice(0, 10),
        status: 'ACTIVE',
        createdByUserId: request.context.userId,
        createdAt: now,
        updatedAt: now,
      },
    });

    for (const [key, value] of Object.entries(plan.featuresJson ?? {})) {
      const existing = await this.repository.getTenantFeatureFlag({
        tenantId,
        key,
      });

      if (existing) {
        existing.enabled = Boolean(value);
        existing.updatedByUserId = request.context.userId;
        existing.updatedAt = now;
        await this.repository.updateTenantFeatureFlag({ featureFlag: existing });
      } else {
        await this.repository.createTenantFeatureFlag({
          featureFlag: {
            id: randomUUID(),
            tenantId,
            key,
            enabled: Boolean(value),
            configJson: {},
            updatedByUserId: request.context.userId,
            createdAt: now,
            updatedAt: now,
          },
        });
      }
    }

    await this.auditService.recordMutation(this.toAuditContext(request.context, tenantId), {
      action: PlatformAdminEvents.TENANT_PLAN_CHANGED,
      entityType: 'TenantSubscription',
      entityId: next.id,
      afterJson: {
        tenantId,
        subscription: next,
      },
    });

    return next;
  }

  async listTenantFeatureFlags(tenantId: string) {
    await this.getTenantOrThrow(tenantId);
    return this.repository.listTenantFeatureFlags(tenantId);
  }

  async upsertTenantFeatureFlag(
    tenantId: string,
    request: AppRequest,
    dto: UpsertFeatureFlagDto,
  ) {
    await this.getTenantOrThrow(tenantId);
    const now = new Date().toISOString();
    const existing = await this.repository.getTenantFeatureFlag({
      tenantId,
      key: dto.key,
    });

    const before = existing ? { ...existing } : undefined;
    const featureFlag = existing
      ? await this.repository.updateTenantFeatureFlag({
          featureFlag: {
            ...existing,
            enabled: dto.enabled,
            configJson: dto.config ?? existing.configJson,
            updatedByUserId: request.context.userId,
            updatedAt: now,
          },
        })
      : await this.repository.createTenantFeatureFlag({
          featureFlag: {
            id: randomUUID(),
            tenantId,
            key: dto.key,
            enabled: dto.enabled,
            configJson: dto.config ?? {},
            updatedByUserId: request.context.userId,
            createdAt: now,
            updatedAt: now,
          },
        });

    await this.auditService.recordMutation(this.toAuditContext(request.context, tenantId), {
      action: PlatformAdminEvents.FEATURE_FLAG_UPDATED,
      entityType: 'TenantFeatureFlag',
      entityId: featureFlag.id,
      beforeJson: before,
      afterJson: featureFlag,
    });

    return featureFlag;
  }

  async getSystemHealth() {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const from = `${today}T00:00:00.000Z`;
    const to = `${today}T23:59:59.999Z`;

    const [activeTenants, queueJobs, tenants] = await Promise.all([
      this.repository.listTenants({ status: 'active' }),
      this.repository.listQueueJobs({ from, to, limit: 2000 }),
      this.repository.listTenants(),
    ]);

    let reservationsToday = 0;
    let paymentsToday = 0;
    for (const tenant of tenants) {
      const properties = await this.repository.listPropertiesByTenant(tenant.id);
      for (const property of properties) {
        const [reservations, payments] = await Promise.all([
          this.repository.listReservations({
            tenantId: tenant.id,
            propertyId: property.id,
          }),
          this.repository.listPayments({
            tenantId: tenant.id,
            propertyId: property.id,
            date: today,
          }),
        ]);
        reservationsToday += reservations.filter(
          (reservation) => reservation.createdAt.slice(0, 10) === today,
        ).length;
        paymentsToday += payments.length;
      }
    }

    const failedJobs = queueJobs.filter((job) => {
      const payloadStatus = (job.payload.status as string | undefined)?.toLowerCase();
      return payloadStatus === 'failed';
    }).length;

    return {
      api: {
        uptimeSeconds: Math.floor(process.uptime()),
      },
      queues: {
        backlog: queueJobs.length,
        failedJobs,
      },
      tenants: {
        total: tenants.length,
        active: activeTenants.length,
      },
      trafficToday: {
        reservations: reservationsToday,
        payments: paymentsToday,
      },
    };
  }

  async listGlobalAudit(query: PlatformAuditQueryDto) {
    const tenantIds = this.parseCsv(query.tenantIds);
    return this.repository.listAuditLogsGlobal({
      tenantIds: tenantIds.length > 0 ? tenantIds : undefined,
      from: query.from,
      to: query.to,
      actorUserId: query.actorUserId,
      action: query.action,
      entityType: query.entityType,
      limit: query.limit ?? 200,
    });
  }

  async startImpersonation(
    tenantId: string,
    request: AppRequest,
    dto: ImpersonateTenantDto,
  ) {
    const tenant = await this.getTenantOrThrow(tenantId);
    if (tenant.status === 'suspended') {
      throw new BadRequestException('Cannot impersonate users in suspended tenant');
    }

    const targetUser = await this.repository.getUserById({
      tenantId,
      userId: dto.targetUserId,
    });
    if (!targetUser) {
      throw new NotFoundException('Target user not found in tenant');
    }
    if (targetUser.status !== 'active') {
      throw new BadRequestException('Target user is not active');
    }

    const now = new Date();
    const startedAt = now.toISOString();
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000).toISOString();
    const session = await this.repository.createImpersonationSession({
      session: {
        id: randomUUID(),
        tenantId,
        targetUserId: targetUser.id,
        token: randomUUID(),
        status: ImpersonationStatus.ACTIVE,
        startedByUserId: request.context.userId,
        startedAt,
        expiresAt,
        reason: dto.reason,
      },
    });

    await this.auditService.recordMutation(this.toAuditContext(request.context, tenantId), {
      action: PlatformAdminEvents.IMPERSONATION_STARTED,
      entityType: 'ImpersonationSession',
      entityId: session.id,
      afterJson: session,
    });

    return {
      session,
      banner: 'IMPERSONATION ACTIVE',
    };
  }

  async endImpersonation(request: AppRequest, sessionId: string, dto: EndImpersonationDto) {
    const session = await this.repository.getImpersonationSessionById(sessionId);
    if (!session) {
      throw new NotFoundException('Impersonation session not found');
    }

    if (session.status !== ImpersonationStatus.ACTIVE) {
      return session;
    }

    const before = { ...session };
    session.status = ImpersonationStatus.ENDED;
    session.endedAt = new Date().toISOString();
    session.endedByUserId = request.context.userId;
    session.reason = dto.reason ?? session.reason;
    const updated = await this.repository.updateImpersonationSession({ session });

    await this.auditService.recordMutation(this.toAuditContext(request.context, session.tenantId), {
      action: PlatformAdminEvents.IMPERSONATION_ENDED,
      entityType: 'ImpersonationSession',
      entityId: session.id,
      beforeJson: before,
      afterJson: updated,
    });

    return updated;
  }

  async resetUserPassword(request: AppRequest, userId: string, dto: ResetUserPasswordDto) {
    const user = await this.repository.getUserByIdGlobal(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const before = { ...user };
    user.passwordHash = `reset-required:${randomUUID()}`;
    user.updatedAt = new Date().toISOString();
    const updated = await this.repository.updateUser({ user });

    await this.auditService.recordMutation(this.toAuditContext(request.context, user.tenantId), {
      action: PlatformAdminEvents.USER_PASSWORD_RESET_BY_PLATFORM,
      entityType: 'User',
      entityId: user.id,
      beforeJson: before,
      afterJson: {
        ...updated,
        reason: dto.reason,
      },
    });

    return {
      userId: user.id,
      tenantId: user.tenantId,
      resetAt: updated.updatedAt,
    };
  }

  async getTenantMetrics(tenantId: string) {
    await this.getTenantOrThrow(tenantId);
    const properties = await this.repository.listPropertiesByTenant(tenantId);
    const users = await this.repository.listUsersByTenant({
      tenantId,
      status: 'active',
    });

    const fromDate = this.shiftDate(new Date().toISOString().slice(0, 10), -6);
    let reservationsLast7d = 0;
    let revenueLast7d = 0;

    for (const property of properties) {
      const [reservations, payments] = await Promise.all([
        this.repository.listReservations({
          tenantId,
          propertyId: property.id,
        }),
        this.repository.listPayments({
          tenantId,
          propertyId: property.id,
        }),
      ]);

      reservationsLast7d += reservations.filter(
        (reservation) => reservation.createdAt.slice(0, 10) >= fromDate,
      ).length;
      revenueLast7d += payments
        .filter((payment) => payment.createdAt.slice(0, 10) >= fromDate)
        .reduce((sum, payment) => sum + payment.amount, 0);
    }

    return {
      tenantId,
      activeProperties: properties.length,
      activeUsers: users.length,
      reservationsLast7d,
      revenueLast7d: this.toCurrency(revenueLast7d),
    };
  }

  private async getTenantOrThrow(tenantId: string) {
    const tenant = await this.repository.getTenant(tenantId);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  private parseCsv(value?: string) {
    if (!value) {
      return [];
    }
    return [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))];
  }

  private shiftDate(date: string, days: number): string {
    const value = new Date(`${date}T00:00:00.000Z`);
    value.setUTCDate(value.getUTCDate() + days);
    return value.toISOString().slice(0, 10);
  }

  private toCurrency(value: number) {
    return Number(value.toFixed(2));
  }

  private toAuditContext(context: RequestContext, tenantId?: string): RequestContext {
    return {
      ...context,
      tenantId: tenantId ?? context.tenantId,
      role: 'PlatformAdmin',
    };
  }
}
