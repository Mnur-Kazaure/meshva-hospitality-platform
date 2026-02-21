'use client';

import { useAsyncMutation } from '../../../shared/lib/hooks/use-async-mutation';
import type { PostKitchenChargeDto } from '../../../shared/types/contracts';
import { postKitchenOrderCharge } from '../../../entities/kitchen-order/api/kitchen-order-api';

interface PostKitchenChargeInput {
  orderId: string;
  dto: PostKitchenChargeDto;
}

export function usePostKitchenCharge(propertyId?: string) {
  return useAsyncMutation<PostKitchenChargeInput, unknown>(
    ({ orderId, dto }) => postKitchenOrderCharge(propertyId, orderId, dto),
    {
      invalidatePrefixes: ['kitchen-orders', 'kitchen-history', 'kitchen-report'],
    },
  );
}
