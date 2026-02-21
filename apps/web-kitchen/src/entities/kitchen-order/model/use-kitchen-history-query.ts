'use client';

import { useMemo } from 'react';
import { KitchenOrderStatuses } from '../../../shared/types/contracts';
import { useKitchenOrdersQuery } from './use-kitchen-orders-query';

export function useKitchenHistoryQuery(propertyId?: string) {
  const query = useKitchenOrdersQuery(propertyId);

  const data = useMemo(() => {
    return query.data.filter(
      (order) =>
        order.status === KitchenOrderStatuses.DELIVERED ||
        order.status === KitchenOrderStatuses.CANCELLED ||
        order.status === KitchenOrderStatuses.CANCELLED_WITH_REASON,
    );
  }, [query.data]);

  return {
    ...query,
    data,
  };
}
