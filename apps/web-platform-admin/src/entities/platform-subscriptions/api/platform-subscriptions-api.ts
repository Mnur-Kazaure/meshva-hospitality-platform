import type {
  CreateSubscriptionPlanDto,
  PlatformSubscriptionPlanDto,
  UpdateSubscriptionPlanDto,
} from '../../../shared/types/contracts';
import { apiClient } from '../../../shared/lib/api/client';

export function listPlatformSubscriptionPlans(): Promise<PlatformSubscriptionPlanDto[]> {
  return apiClient.get<PlatformSubscriptionPlanDto[]>('/platform/subscription-plans');
}

export function createPlatformSubscriptionPlan(
  dto: CreateSubscriptionPlanDto,
): Promise<PlatformSubscriptionPlanDto> {
  return apiClient.post<PlatformSubscriptionPlanDto>(
    '/platform/subscription-plans',
    dto,
    'platform-plan-create',
  );
}

export function updatePlatformSubscriptionPlan(
  planId: string,
  dto: UpdateSubscriptionPlanDto,
): Promise<PlatformSubscriptionPlanDto> {
  return apiClient.patch<PlatformSubscriptionPlanDto>(
    `/platform/subscription-plans/${planId}`,
    dto,
    'platform-plan-update',
  );
}
