import type { GuestProfileDto, UpdateGuestProfileDto } from '../../../shared/types/contracts';
import { apiClient } from '../../../shared/lib/api/client';

export async function getGuestProfile(): Promise<GuestProfileDto> {
  return apiClient.get<GuestProfileDto>('/guest/profile');
}

export async function updateGuestProfile(dto: UpdateGuestProfileDto): Promise<GuestProfileDto> {
  return apiClient.patch<GuestProfileDto>('/guest/profile', dto, 'guest-profile-update');
}
