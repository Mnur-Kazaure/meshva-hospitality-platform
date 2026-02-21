'use client';

import type { OwnerDateRangeQueryDto, OwnerOperationsSummaryResponseDto } from '../../../shared/types/contracts';
import { useAsyncQuery } from '../../../shared/lib/hooks/use-async-query';
import { getOwnerOperationsSummary } from '../api/owner-reporting-api';

const emptyOperations: OwnerOperationsSummaryResponseDto = {
  range: { from: '', to: '', days: 0 },
  breakdownByProperty: [],
  totals: {
    arrivals: 0,
    departures: 0,
    noShows: 0,
    dirtyRooms: 0,
  },
};

export function useOwnerOperationsSummaryQuery(query?: OwnerDateRangeQueryDto) {
  const queryKey = JSON.stringify(query ?? {});
  return useAsyncQuery<OwnerOperationsSummaryResponseDto>(
    `owner-operations-summary:${queryKey}`,
    () => getOwnerOperationsSummary(query),
    emptyOperations,
  );
}
