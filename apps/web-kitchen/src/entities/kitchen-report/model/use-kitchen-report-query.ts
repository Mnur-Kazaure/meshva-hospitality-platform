'use client';

import { useAsyncQuery } from '../../../shared/lib/hooks/use-async-query';
import { getKitchenReport } from '../api/kitchen-report-api';
import type { KitchenReport } from './types';

export function useKitchenReportQuery(propertyId?: string) {
  return useAsyncQuery<KitchenReport>(
    `kitchen-report:${propertyId ?? 'none'}`,
    () => getKitchenReport(propertyId),
    {
      totalOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0,
      averagePrepMinutes: 0,
      topItems: [],
    },
  );
}
