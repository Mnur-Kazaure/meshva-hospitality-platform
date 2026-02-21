'use client';

import type { PublicSearchDto, PublicSearchResponseDto } from '../../../shared/types/contracts';
import { useAsyncQuery } from '../../../shared/lib/hooks/use-async-query';
import { searchPublicAvailability } from '../api/public-search-api';

function emptyResult(checkIn?: string, checkOut?: string): PublicSearchResponseDto {
  return {
    checkIn: checkIn ?? '',
    checkOut: checkOut ?? '',
    count: 0,
    rows: [],
  };
}

export function usePublicSearchQuery(query?: PublicSearchDto) {
  const enabled = Boolean(query?.checkIn && query?.checkOut);
  const key = enabled ? `public-search:${JSON.stringify(query)}` : 'public-search:idle';

  return useAsyncQuery<PublicSearchResponseDto>(
    key,
    async () => {
      if (!query || !enabled) {
        return emptyResult(query?.checkIn, query?.checkOut);
      }

      return searchPublicAvailability(query);
    },
    emptyResult(query?.checkIn, query?.checkOut),
  );
}
