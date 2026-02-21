'use client';

import type { ExecuteRefundDto, ExecuteRefundResponseDto } from '../../../shared/types/contracts';
import { useAsyncMutation } from '../../../shared/lib/hooks/use-async-mutation';
import { executeRefund } from '../../../entities/refund/api/refund-api';

interface ExecuteRefundInput {
  propertyId: string;
  refundId: string;
  dto: ExecuteRefundDto;
}

export function useExecuteRefundMutation() {
  return useAsyncMutation<ExecuteRefundInput, ExecuteRefundResponseDto>(
    ({ propertyId, refundId, dto }) => executeRefund(propertyId, refundId, dto),
    {
      invalidatePrefixes: ['finance-refunds:', 'finance-payments:', 'finance-overview:'],
    },
  );
}
