import type { PropertyDetailsResponseDto } from '../../../shared/types/contracts';
import { apiClient } from '../../../shared/lib/api/client';

export async function getPropertyDetails(propertyId: string): Promise<PropertyDetailsResponseDto> {
  return apiClient.get<PropertyDetailsResponseDto>(`/public/properties/${propertyId}`);
}
