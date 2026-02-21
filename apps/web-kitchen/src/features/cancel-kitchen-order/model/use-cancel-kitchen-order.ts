'use client';

import { useAsyncMutation } from '../../../shared/lib/hooks/use-async-mutation';
import type { CancelOrderDto } from '../../../shared/types/contracts';
import {
  cancelKitchenOrder,
  cancelKitchenOrderWithOverride,
} from '../../../entities/kitchen-order/api/kitchen-order-api';

interface CancelKitchenOrderInput {
  orderId: string;
  dto: CancelOrderDto;
  override?: boolean;
}

export function useCancelKitchenOrder(propertyId?: string) {
  return useAsyncMutation<CancelKitchenOrderInput, unknown>(
    ({ orderId, dto, override }) => {
      if (override) {
        return cancelKitchenOrderWithOverride(propertyId, orderId, dto);
      }
      return cancelKitchenOrder(propertyId, orderId, dto);
    },
    {
      invalidatePrefixes: ['kitchen-orders', 'kitchen-history', 'kitchen-report'],
    },
  );
}
