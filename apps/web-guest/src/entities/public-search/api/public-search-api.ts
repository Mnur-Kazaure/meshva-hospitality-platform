import type { PublicSearchDto, PublicSearchResponseDto } from '../../../shared/types/contracts';
import { apiClient } from '../../../shared/lib/api/client';

function toQueryString(query: PublicSearchDto): string {
  const params = new URLSearchParams();

  if (query.location?.trim()) {
    params.set('location', query.location.trim());
  }

  params.set('checkIn', query.checkIn);
  params.set('checkOut', query.checkOut);

  if (typeof query.adults === 'number') {
    params.set('adults', String(query.adults));
  }

  if (typeof query.children === 'number') {
    params.set('children', String(query.children));
  }

  return params.toString();
}

export async function searchPublicAvailability(query: PublicSearchDto): Promise<PublicSearchResponseDto> {
  const qs = toQueryString(query);
  return apiClient.get<PublicSearchResponseDto>(`/public/search?${qs}`);
}
