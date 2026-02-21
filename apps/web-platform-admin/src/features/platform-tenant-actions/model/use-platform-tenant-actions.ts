'use client';

import type {
  AssignPlanDto,
  CreateTenantDto,
  ImpersonateTenantDto,
  PlatformImpersonationStartResponseDto,
  PlatformTenantFeatureFlagDto,
  PlatformTenantSubscriptionDto,
  PlatformTenantDto,
  SuspendTenantDto,
  UpsertFeatureFlagDto,
} from '../../../shared/types/contracts';
import { useAsyncMutation } from '../../../shared/lib/hooks/use-async-mutation';
import {
  assignPlatformTenantPlan,
  createPlatformTenant,
  reactivatePlatformTenant,
  startPlatformTenantImpersonation,
  suspendPlatformTenant,
  upsertPlatformTenantFeatureFlag,
} from '../../../entities/platform-tenants/api/platform-tenants-api';

export function useCreatePlatformTenantMutation() {
  return useAsyncMutation<CreateTenantDto, {
    tenant: PlatformTenantDto;
    property: { id: string; name: string; tenantId: string };
    ownerUser: { id: string; fullName: string; email?: string; phone?: string; tenantId: string };
    plan: { id: string; code: string; name: string };
  }>(createPlatformTenant, {
    invalidatePrefixes: ['platform-tenants:'],
  });
}

interface TenantSuspendInput {
  tenantId: string;
  dto: SuspendTenantDto;
}

export function useSuspendPlatformTenantMutation() {
  return useAsyncMutation<TenantSuspendInput, PlatformTenantDto>(
    ({ tenantId, dto }) => suspendPlatformTenant(tenantId, dto),
    {
      invalidatePrefixes: ['platform-tenants:', 'platform-tenant-details:'],
    },
  );
}

export function useReactivatePlatformTenantMutation() {
  return useAsyncMutation<string, PlatformTenantDto>(reactivatePlatformTenant, {
    invalidatePrefixes: ['platform-tenants:', 'platform-tenant-details:'],
  });
}

interface AssignPlanInput {
  tenantId: string;
  dto: AssignPlanDto;
}

export function useAssignPlatformPlanMutation() {
  return useAsyncMutation<AssignPlanInput, PlatformTenantSubscriptionDto>(
    ({ tenantId, dto }) => assignPlatformTenantPlan(tenantId, dto),
    {
      invalidatePrefixes: ['platform-tenants:', 'platform-tenant-details:'],
    },
  );
}

interface UpsertFlagInput {
  tenantId: string;
  dto: UpsertFeatureFlagDto;
}

export function useUpsertPlatformFeatureFlagMutation() {
  return useAsyncMutation<UpsertFlagInput, PlatformTenantFeatureFlagDto>(
    ({ tenantId, dto }) => upsertPlatformTenantFeatureFlag(tenantId, dto),
    {
      invalidatePrefixes: ['platform-tenant-flags:', 'platform-tenant-details:'],
    },
  );
}

interface StartImpersonationInput {
  tenantId: string;
  dto: ImpersonateTenantDto;
}

export function useStartPlatformImpersonationMutation() {
  return useAsyncMutation<StartImpersonationInput, PlatformImpersonationStartResponseDto>(
    ({ tenantId, dto }) => startPlatformTenantImpersonation(tenantId, dto),
    {
      invalidatePrefixes: ['platform-tenants:', 'platform-tenant-details:'],
    },
  );
}
