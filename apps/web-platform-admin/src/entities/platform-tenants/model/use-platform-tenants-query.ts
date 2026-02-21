'use client';

import type {
  ListTenantsDto,
  PlatformTenantDetailsResponseDto,
  PlatformTenantFeatureFlagDto,
  PlatformTenantListResponseDto,
  PlatformTenantMetricsDto,
} from '../../../shared/types/contracts';
import { useAsyncQuery } from '../../../shared/lib/hooks/use-async-query';
import {
  getPlatformTenantDetails,
  getPlatformTenantMetrics,
  listPlatformTenantFeatureFlags,
  listPlatformTenants,
} from '../api/platform-tenants-api';

const emptyTenantList: PlatformTenantListResponseDto = {
  count: 0,
  rows: [],
};

const emptyTenantDetails: PlatformTenantDetailsResponseDto = {
  tenant: {
    id: '',
    name: '',
    timezone: '',
    status: 'pending',
  },
  properties: [],
  users: [],
  featureFlags: [],
};

const emptyTenantMetrics: PlatformTenantMetricsDto = {
  tenantId: '',
  activeProperties: 0,
  activeUsers: 0,
  reservationsLast7d: 0,
  revenueLast7d: 0,
};

export function usePlatformTenantsQuery(query?: ListTenantsDto) {
  const queryKey = JSON.stringify(query ?? {});
  return useAsyncQuery<PlatformTenantListResponseDto>(
    `platform-tenants:${queryKey}`,
    () => listPlatformTenants(query),
    emptyTenantList,
  );
}

export function usePlatformTenantDetailsQuery(tenantId?: string) {
  return useAsyncQuery<PlatformTenantDetailsResponseDto>(
    `platform-tenant-details:${tenantId ?? 'none'}`,
    () => {
      if (!tenantId) {
        return Promise.resolve(emptyTenantDetails);
      }

      return getPlatformTenantDetails(tenantId);
    },
    emptyTenantDetails,
  );
}

export function usePlatformTenantFeatureFlagsQuery(tenantId?: string) {
  return useAsyncQuery<PlatformTenantFeatureFlagDto[]>(
    `platform-tenant-flags:${tenantId ?? 'none'}`,
    () => {
      if (!tenantId) {
        return Promise.resolve([]);
      }

      return listPlatformTenantFeatureFlags(tenantId);
    },
    [],
  );
}

export function usePlatformTenantMetricsQuery(tenantId?: string) {
  return useAsyncQuery<PlatformTenantMetricsDto>(
    `platform-tenant-metrics:${tenantId ?? 'none'}`,
    () => {
      if (!tenantId) {
        return Promise.resolve(emptyTenantMetrics);
      }

      return getPlatformTenantMetrics(tenantId);
    },
    emptyTenantMetrics,
  );
}
