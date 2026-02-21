'use client';

import type { PlatformSubscriptionPlanDto } from '../../../shared/types/contracts';
import { useAsyncQuery } from '../../../shared/lib/hooks/use-async-query';
import { listPlatformSubscriptionPlans } from '../api/platform-subscriptions-api';

export function usePlatformSubscriptionsQuery() {
  return useAsyncQuery<PlatformSubscriptionPlanDto[]>(
    'platform-subscriptions',
    listPlatformSubscriptionPlans,
    [],
  );
}
