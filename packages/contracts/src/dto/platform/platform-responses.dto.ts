import type { ImpersonationStatus } from '../../enums/impersonation-status';
import type { SubscriptionPlanCode } from '../../enums/subscription-plan-code';

export interface PlatformTenantDto {
  id: string;
  name: string;
  legalName?: string;
  primaryPhone?: string;
  primaryEmail?: string;
  country?: string;
  state?: string;
  city?: string;
  timezone: string;
  status: 'active' | 'suspended' | 'pending';
  createdAt?: string;
  updatedAt?: string;
}

export interface PlatformTenantListRowDto extends PlatformTenantDto {
  propertiesCount: number;
  activePlan: {
    id: string;
    code: SubscriptionPlanCode;
    name: string;
  } | null;
}

export interface PlatformTenantListResponseDto {
  count: number;
  rows: PlatformTenantListRowDto[];
}

export interface PlatformPropertyDto {
  id: string;
  tenantId: string;
  name: string;
  state: string;
  city: string;
  status: 'active' | 'inactive';
}

export interface PlatformUserDto {
  id: string;
  tenantId: string;
  fullName: string;
  phone?: string;
  email?: string;
  authProvider: 'password' | 'otp' | 'oauth';
  status: 'active' | 'disabled';
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformTenantSubscriptionDto {
  id: string;
  tenantId: string;
  subscriptionPlanId: string;
  effectiveFrom: string;
  effectiveTo?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformTenantFeatureFlagDto {
  id: string;
  tenantId: string;
  key: string;
  enabled: boolean;
  configJson: Record<string, unknown>;
  updatedByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformTenantDetailsResponseDto {
  tenant: PlatformTenantDto;
  properties: PlatformPropertyDto[];
  users: PlatformUserDto[];
  activeSubscription?: PlatformTenantSubscriptionDto;
  featureFlags: PlatformTenantFeatureFlagDto[];
}

export interface PlatformSubscriptionPlanDto {
  id: string;
  code: SubscriptionPlanCode;
  name: string;
  description?: string;
  propertyLimit: number;
  userLimit: number;
  featuresJson: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformSystemHealthResponseDto {
  api: {
    uptimeSeconds: number;
  };
  queues: {
    backlog: number;
    failedJobs: number;
  };
  tenants: {
    total: number;
    active: number;
  };
  trafficToday: {
    reservations: number;
    payments: number;
  };
}

export interface PlatformAuditLogDto {
  id: string;
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
  createdAt: string;
}

export interface PlatformImpersonationSessionDto {
  id: string;
  tenantId: string;
  targetUserId: string;
  token: string;
  status: ImpersonationStatus;
  startedByUserId: string;
  startedAt: string;
  expiresAt: string;
  endedAt?: string;
  endedByUserId?: string;
  reason?: string;
}

export interface PlatformImpersonationStartResponseDto {
  session: PlatformImpersonationSessionDto;
  banner: string;
}

export interface PlatformResetUserPasswordResponseDto {
  userId: string;
  tenantId: string;
  resetAt: string;
}

export interface PlatformTenantMetricsDto {
  tenantId: string;
  activeProperties: number;
  activeUsers: number;
  reservationsLast7d: number;
  revenueLast7d: number;
}
