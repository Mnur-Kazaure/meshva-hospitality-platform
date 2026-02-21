'use client';

import type { PaymentRecordDto } from '../../../shared/types/contracts';
import { useAsyncQuery } from '../../../shared/lib/hooks/use-async-query';
import { listPayments } from '../api/payment-api';

export function usePaymentsQuery(propertyId?: string) {
  const key = propertyId ? `finance-payments:${propertyId}` : 'finance-payments:idle';

  return useAsyncQuery<PaymentRecordDto[]>(
    key,
    async () => {
      if (!propertyId) {
        return [];
      }
      return listPayments(propertyId);
    },
    [],
  );
}
