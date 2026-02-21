'use client';

import type {
  DeactivateStaffDto,
  SoftDeleteStaffDto,
  StaffStatusResponseDto,
} from '../../../shared/types/contracts';
import { useAsyncMutation } from '../../../shared/lib/hooks/use-async-mutation';
import {
  activateStaff,
  deactivateStaff,
  softDeleteStaff,
} from '../../../entities/staff/api/staff-api';

interface DeactivateInput {
  propertyId: string;
  userId: string;
  dto: DeactivateStaffDto;
}

interface ActivateInput {
  propertyId: string;
  userId: string;
}

interface SoftDeleteInput {
  propertyId: string;
  userId: string;
  dto: SoftDeleteStaffDto;
}

export function useStaffDeactivateMutation() {
  return useAsyncMutation<DeactivateInput, StaffStatusResponseDto>(
    ({ propertyId, userId, dto }) => deactivateStaff(propertyId, userId, dto),
    {
      invalidatePrefixes: ['staff-list:'],
    },
  );
}

export function useStaffActivateMutation() {
  return useAsyncMutation<ActivateInput, StaffStatusResponseDto>(
    ({ propertyId, userId }) => activateStaff(propertyId, userId),
    {
      invalidatePrefixes: ['staff-list:'],
    },
  );
}

export function useStaffSoftDeleteMutation() {
  return useAsyncMutation<SoftDeleteInput, StaffStatusResponseDto>(
    ({ propertyId, userId, dto }) => softDeleteStaff(propertyId, userId, dto),
    {
      invalidatePrefixes: ['staff-list:'],
    },
  );
}
