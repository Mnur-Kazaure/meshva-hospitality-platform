'use client';

import type { ListStaffDto, StaffListResponseDto } from '../../../shared/types/contracts';
import { useAsyncQuery } from '../../../shared/lib/hooks/use-async-query';
import { listStaff } from '../api/staff-api';

const emptyResponse: StaffListResponseDto = {
  count: 0,
  rows: [],
};

export function useStaffListQuery(propertyId?: string, query?: ListStaffDto) {
  const key = propertyId
    ? `staff-list:${propertyId}:${query?.status ?? 'all'}:${query?.q ?? ''}`
    : 'staff-list:idle';

  return useAsyncQuery<StaffListResponseDto>(
    key,
    async () => {
      if (!propertyId) {
        return emptyResponse;
      }

      return listStaff(propertyId, query);
    },
    emptyResponse,
  );
}
