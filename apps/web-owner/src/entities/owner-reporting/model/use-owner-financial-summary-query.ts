'use client';

import type { OwnerDateRangeQueryDto, OwnerFinancialSummaryResponseDto } from '../../../shared/types/contracts';
import { useAsyncQuery } from '../../../shared/lib/hooks/use-async-query';
import { getOwnerFinancialSummary } from '../api/owner-reporting-api';

const emptyFinancial: OwnerFinancialSummaryResponseDto = {
  range: { from: '', to: '', days: 0 },
  totals: {
    revenueByMethod: {
      cash: 0,
      transfer: 0,
      pos: 0,
    },
    netRevenue: 0,
    refunds: {
      count: 0,
      value: 0,
    },
    discounts: {
      count: 0,
      value: 0,
    },
    outstandingBalance: 0,
  },
  breakdownByProperty: [],
};

export function useOwnerFinancialSummaryQuery(query?: OwnerDateRangeQueryDto) {
  const queryKey = JSON.stringify(query ?? {});
  return useAsyncQuery<OwnerFinancialSummaryResponseDto>(
    `owner-financial-summary:${queryKey}`,
    () => getOwnerFinancialSummary(query),
    emptyFinancial,
  );
}
