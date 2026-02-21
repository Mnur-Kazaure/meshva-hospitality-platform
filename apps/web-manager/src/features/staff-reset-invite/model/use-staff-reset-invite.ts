'use client';

import type {
  StaffResetInviteResponseDto,
  StaffResetPasswordDto,
} from '../../../shared/types/contracts';
import { useAsyncMutation } from '../../../shared/lib/hooks/use-async-mutation';
import { resetStaffInvite } from '../../../entities/staff/api/staff-api';

interface ResetInviteInput {
  propertyId: string;
  userId: string;
  dto?: StaffResetPasswordDto;
}

export function useStaffResetInviteMutation() {
  return useAsyncMutation<ResetInviteInput, StaffResetInviteResponseDto>(
    ({ propertyId, userId, dto }) => resetStaffInvite(propertyId, userId, dto),
    {
      invalidatePrefixes: ['staff-list:'],
    },
  );
}
