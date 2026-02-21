'use client';

import type { PropertyDetailsResponseDto } from '../../../shared/types/contracts';
import { useAsyncQuery } from '../../../shared/lib/hooks/use-async-query';
import { getPropertyDetails } from '../api/property-api';

export function usePropertyDetailsQuery(propertyId?: string) {
  const key = propertyId ? `property-details:${propertyId}` : 'property-details:idle';

  return useAsyncQuery<PropertyDetailsResponseDto | null>(
    key,
    async () => {
      if (!propertyId) {
        return null;
      }

      return getPropertyDetails(propertyId);
    },
    null,
  );
}
