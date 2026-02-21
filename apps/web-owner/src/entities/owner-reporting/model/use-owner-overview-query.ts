'use client';

import type { OwnerDateRangeQueryDto, OwnerOverviewResponseDto } from '../../../shared/types/contracts';
import { useAsyncQuery } from '../../../shared/lib/hooks/use-async-query';
import { getOwnerOverview } from '../api/owner-reporting-api';

const emptyOverview: OwnerOverviewResponseDto = {
  range: { from: '', to: '', days: 0 },
  totals: {
    revenue: 0,
    occupancy: 0,
    outstandingBalance: 0,
    closeCompliance: 0,
    exceptionsCount: 0,
  },
  breakdownByProperty: [],
};

export function useOwnerOverviewQuery(query?: OwnerDateRangeQueryDto) {
  const queryKey = JSON.stringify(query ?? {});
  return useAsyncQuery<OwnerOverviewResponseDto>(
    `owner-overview:${queryKey}`,
    () => getOwnerOverview(query),
    emptyOverview,
  );
}
