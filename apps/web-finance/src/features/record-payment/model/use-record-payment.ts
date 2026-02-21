'use client';

import type { RecordPaymentDto, RecordPaymentResponseDto } from '../../../shared/types/contracts';
import { useAsyncMutation } from '../../../shared/lib/hooks/use-async-mutation';
import { recordPayment } from '../../../entities/payment/api/payment-api';

interface RecordPaymentInput {
  propertyId: string;
  dto: RecordPaymentDto;
}

export function useRecordPaymentMutation() {
  return useAsyncMutation<RecordPaymentInput, RecordPaymentResponseDto>(
    ({ propertyId, dto }) => recordPayment(propertyId, dto),
    {
      invalidatePrefixes: ['finance-payments:', 'finance-refunds:', 'finance-overview:'],
    },
  );
}
