'use client';

import type { KitchenOrderStatus } from '../../../shared/types/contracts';
import { useAsyncQuery } from '../../../shared/lib/hooks/use-async-query';
import { getKitchenOrders } from '../api/kitchen-order-api';
import type { KitchenOrder } from './types';

export function useKitchenOrdersQuery(propertyId?: string, status?: KitchenOrderStatus) {
  const queryKey = `kitchen-orders:${propertyId ?? 'none'}:${status ?? 'all'}`;

  return useAsyncQuery<KitchenOrder[]>(queryKey, () => getKitchenOrders(propertyId, status), []);
}
