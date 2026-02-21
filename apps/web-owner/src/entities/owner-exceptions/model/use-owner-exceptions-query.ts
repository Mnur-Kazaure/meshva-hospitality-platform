'use client';

import type { OwnerExceptionsQueryDto, OwnerExceptionsResponseDto } from '../../../shared/types/contracts';
import { useAsyncQuery } from '../../../shared/lib/hooks/use-async-query';
import { listOwnerExceptions } from '../api/owner-exceptions-api';

const emptyResponse: OwnerExceptionsResponseDto = {
  range: { from: '', to: '', days: 0 },
  exceptions: [],
};

export function useOwnerExceptionsQuery(query?: OwnerExceptionsQueryDto) {
  const queryKey = JSON.stringify(query ?? {});
  return useAsyncQuery<OwnerExceptionsResponseDto>(
    `owner-exceptions:${queryKey}`,
    () => listOwnerExceptions(query),
    emptyResponse,
  );
}
