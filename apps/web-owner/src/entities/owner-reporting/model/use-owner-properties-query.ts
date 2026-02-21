'use client';

import type { OwnerDateRangeQueryDto, OwnerPropertiesResponseDto } from '../../../shared/types/contracts';
import { useAsyncQuery } from '../../../shared/lib/hooks/use-async-query';
import { getOwnerProperties } from '../api/owner-reporting-api';

const emptyProperties: OwnerPropertiesResponseDto = {
  range: { from: '', to: '', days: 0 },
  rows: [],
};

export function useOwnerPropertiesQuery(query?: OwnerDateRangeQueryDto) {
  const queryKey = JSON.stringify(query ?? {});
  return useAsyncQuery<OwnerPropertiesResponseDto>(
    `owner-properties:${queryKey}`,
    () => getOwnerProperties(query),
    emptyProperties,
  );
}
