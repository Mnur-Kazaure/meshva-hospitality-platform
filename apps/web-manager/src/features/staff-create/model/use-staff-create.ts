'use client';

import type { CreateStaffDto, StaffCreateResponseDto } from '../../../shared/types/contracts';
import { useAsyncMutation } from '../../../shared/lib/hooks/use-async-mutation';
import { createStaff } from '../../../entities/staff/api/staff-api';

interface StaffCreateInput {
  propertyId: string;
  dto: CreateStaffDto;
}

export function useStaffCreateMutation() {
  return useAsyncMutation<StaffCreateInput, StaffCreateResponseDto>(
    ({ propertyId, dto }) => createStaff(propertyId, dto),
    {
      invalidatePrefixes: ['staff-list:'],
    },
  );
}
