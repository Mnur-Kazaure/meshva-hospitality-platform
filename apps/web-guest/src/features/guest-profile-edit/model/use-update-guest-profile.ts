'use client';

import type { GuestProfileDto, UpdateGuestProfileDto } from '../../../shared/types/contracts';
import { useAsyncMutation } from '../../../shared/lib/hooks/use-async-mutation';
import { updateGuestProfile } from '../../../entities/guest-profile/api/guest-profile-api';

export function useUpdateGuestProfileMutation() {
  return useAsyncMutation<UpdateGuestProfileDto, GuestProfileDto>(updateGuestProfile, {
    invalidatePrefixes: ['guest-profile'],
  });
}
