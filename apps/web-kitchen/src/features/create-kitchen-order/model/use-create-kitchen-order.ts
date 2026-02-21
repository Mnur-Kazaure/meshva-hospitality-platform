'use client';

import { useAsyncMutation } from '../../../shared/lib/hooks/use-async-mutation';
import type { CreateKitchenOrderDto } from '../../../shared/types/contracts';
import { createKitchenOrder } from '../../../entities/kitchen-order/api/kitchen-order-api';

export function useCreateKitchenOrder(propertyId?: string) {
  return useAsyncMutation<CreateKitchenOrderDto, unknown>(
    (input) => createKitchenOrder(propertyId, input),
    {
      invalidatePrefixes: ['kitchen-orders', 'kitchen-report'],
    },
  );
}
