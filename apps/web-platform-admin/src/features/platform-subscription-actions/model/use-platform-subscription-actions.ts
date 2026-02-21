'use client';

import type {
  CreateSubscriptionPlanDto,
  PlatformSubscriptionPlanDto,
  UpdateSubscriptionPlanDto,
} from '../../../shared/types/contracts';
import { useAsyncMutation } from '../../../shared/lib/hooks/use-async-mutation';
import {
  createPlatformSubscriptionPlan,
  updatePlatformSubscriptionPlan,
} from '../../../entities/platform-subscriptions/api/platform-subscriptions-api';

export function useCreatePlatformSubscriptionMutation() {
  return useAsyncMutation<CreateSubscriptionPlanDto, PlatformSubscriptionPlanDto>(
    createPlatformSubscriptionPlan,
    {
      invalidatePrefixes: ['platform-subscriptions'],
    },
  );
}

interface UpdatePlanInput {
  planId: string;
  dto: UpdateSubscriptionPlanDto;
}

export function useUpdatePlatformSubscriptionMutation() {
  return useAsyncMutation<UpdatePlanInput, PlatformSubscriptionPlanDto>(
    ({ planId, dto }) => updatePlatformSubscriptionPlan(planId, dto),
    {
      invalidatePrefixes: ['platform-subscriptions', 'platform-tenants:', 'platform-tenant-details:'],
    },
  );
}
