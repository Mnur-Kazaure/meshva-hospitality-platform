'use client';

import type { StaffUpdateResponseDto, UpdateStaffDto } from '../../../shared/types/contracts';
import { useAsyncMutation } from '../../../shared/lib/hooks/use-async-mutation';
import { updateStaff } from '../../../entities/staff/api/staff-api';

interface StaffUpdateInput {
  propertyId: string;
  userId: string;
  dto: UpdateStaffDto;
}

export function useStaffUpdateMutation() {
  return useAsyncMutation<StaffUpdateInput, StaffUpdateResponseDto>(
    ({ propertyId, userId, dto }) => updateStaff(propertyId, userId, dto),
    {
      invalidatePrefixes: ['staff-list:'],
    },
  );
}
