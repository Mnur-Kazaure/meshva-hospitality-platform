'use client';

import type { HousekeepingRoomStatusBoardItemDto } from '../../../shared/types/contracts';
import { useAsyncQuery } from '../../../shared/lib/hooks/use-async-query';
import { getRoomStatusBoard } from '../api/housekeeping-api';

export function useRoomStatusBoardQuery(propertyId?: string) {
  return useAsyncQuery<HousekeepingRoomStatusBoardItemDto[]>(
    `housekeeping-room-status:${propertyId ?? 'none'}`,
    () => {
      if (!propertyId) {
        return Promise.resolve([]);
      }

      return getRoomStatusBoard(propertyId);
    },
    [],
  );
}
