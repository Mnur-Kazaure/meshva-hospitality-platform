'use client';

import { useAsyncMutation } from '../../../shared/lib/hooks/use-async-mutation';
import type { ChangeOrderStatusDto } from '../../../shared/types/contracts';
import { changeKitchenOrderStatus } from '../../../entities/kitchen-order/api/kitchen-order-api';

interface ChangeStatusInput {
  orderId: string;
  dto: ChangeOrderStatusDto;
}

export function useOrderStatusTransition(propertyId?: string) {
  return useAsyncMutation<ChangeStatusInput, unknown>(
    ({ orderId, dto }) => changeKitchenOrderStatus(propertyId, orderId, dto),
    {
      invalidatePrefixes: ['kitchen-orders', 'kitchen-history', 'kitchen-report'],
    },
  );
}
