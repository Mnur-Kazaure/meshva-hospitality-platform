import type {
  AssignPlanDto,
  CreateTenantDto,
  ImpersonateTenantDto,
  ListTenantsDto,
  PlatformImpersonationStartResponseDto,
  PlatformTenantDetailsResponseDto,
  PlatformTenantFeatureFlagDto,
  PlatformTenantListResponseDto,
  PlatformTenantMetricsDto,
  PlatformTenantSubscriptionDto,
  PlatformTenantDto,
  SuspendTenantDto,
  UpsertFeatureFlagDto,
} from '../../../shared/types/contracts';
import { apiClient } from '../../../shared/lib/api/client';

function toTenantListQuery(query?: ListTenantsDto): string {
  const params = new URLSearchParams();
  if (query?.status) {
    params.set('status', query.status);
  }

  const payload = params.toString();
  return payload ? `?${payload}` : '';
}

export function listPlatformTenants(query?: ListTenantsDto): Promise<PlatformTenantListResponseDto> {
  return apiClient.get<PlatformTenantListResponseDto>(`/platform/tenants${toTenantListQuery(query)}`);
}

export function getPlatformTenantDetails(tenantId: string): Promise<PlatformTenantDetailsResponseDto> {
  return apiClient.get<PlatformTenantDetailsResponseDto>(`/platform/tenants/${tenantId}`);
}

export function createPlatformTenant(dto: CreateTenantDto): Promise<{
  tenant: PlatformTenantDto;
  property: { id: string; name: string; tenantId: string };
  ownerUser: { id: string; fullName: string; email?: string; phone?: string; tenantId: string };
  plan: { id: string; code: string; name: string };
}> {
  return apiClient.post('/platform/tenants', dto, 'platform-tenant-create');
}

export function suspendPlatformTenant(tenantId: string, dto: SuspendTenantDto): Promise<PlatformTenantDto> {
  return apiClient.post<PlatformTenantDto>(
    `/platform/tenants/${tenantId}/suspend`,
    dto,
    'platform-tenant-suspend',
  );
}

export function reactivatePlatformTenant(tenantId: string): Promise<PlatformTenantDto> {
  return apiClient.post<PlatformTenantDto>(
    `/platform/tenants/${tenantId}/reactivate`,
    {},
    'platform-tenant-reactivate',
  );
}

export function assignPlatformTenantPlan(
  tenantId: string,
  dto: AssignPlanDto,
): Promise<PlatformTenantSubscriptionDto> {
  return apiClient.post<PlatformTenantSubscriptionDto>(
    `/platform/tenants/${tenantId}/assign-plan`,
    dto,
    'platform-tenant-assign-plan',
  );
}

export function listPlatformTenantFeatureFlags(
  tenantId: string,
): Promise<PlatformTenantFeatureFlagDto[]> {
  return apiClient.get<PlatformTenantFeatureFlagDto[]>(`/platform/tenants/${tenantId}/feature-flags`);
}

export function upsertPlatformTenantFeatureFlag(
  tenantId: string,
  dto: UpsertFeatureFlagDto,
): Promise<PlatformTenantFeatureFlagDto> {
  return apiClient.post<PlatformTenantFeatureFlagDto>(
    `/platform/tenants/${tenantId}/feature-flags`,
    dto,
    'platform-tenant-flag-upsert',
  );
}

export function getPlatformTenantMetrics(tenantId: string): Promise<PlatformTenantMetricsDto> {
  return apiClient.get<PlatformTenantMetricsDto>(`/platform/tenants/${tenantId}/metrics`);
}

export function startPlatformTenantImpersonation(
  tenantId: string,
  dto: ImpersonateTenantDto,
): Promise<PlatformImpersonationStartResponseDto> {
  return apiClient.post<PlatformImpersonationStartResponseDto>(
    `/platform/tenants/${tenantId}/impersonate`,
    dto,
    'platform-tenant-impersonate',
  );
}
