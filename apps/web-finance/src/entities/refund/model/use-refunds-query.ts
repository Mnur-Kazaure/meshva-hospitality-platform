'use client';

import type { RefundListItemDto } from '../../../shared/types/contracts';
import { useAsyncQuery } from '../../../shared/lib/hooks/use-async-query';
import { listApprovedRefunds } from '../api/refund-api';

export function useRefundsQuery(propertyId?: string) {
  const key = propertyId ? `finance-refunds:${propertyId}` : 'finance-refunds:idle';

  return useAsyncQuery<RefundListItemDto[]>(
    key,
    async () => {
      if (!propertyId) {
        return [];
      }
      return listApprovedRefunds(propertyId);
    },
    [],
  );
}
