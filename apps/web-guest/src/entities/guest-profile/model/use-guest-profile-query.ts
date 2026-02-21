'use client';

import type { GuestProfileDto } from '../../../shared/types/contracts';
import { useAsyncQuery } from '../../../shared/lib/hooks/use-async-query';
import { getGuestProfile } from '../api/guest-profile-api';

const emptyProfile: GuestProfileDto = {
  fullName: null,
  phone: undefined,
  email: undefined,
};

export function useGuestProfileQuery() {
  return useAsyncQuery<GuestProfileDto>('guest-profile', getGuestProfile, emptyProfile);
}
