'use client';

import type { HousekeepingTaskDto, ListHousekeepingTasksDto } from '../../../shared/types/contracts';
import { useAsyncQuery } from '../../../shared/lib/hooks/use-async-query';
import { listHousekeepingTasks } from '../api/housekeeping-api';

export function useHousekeepingTasksQuery(propertyId?: string, query?: ListHousekeepingTasksDto) {
  const queryKey = JSON.stringify(query ?? {});
  return useAsyncQuery<HousekeepingTaskDto[]>(
    `housekeeping-tasks:${propertyId ?? 'none'}:${queryKey}`,
    () => {
      if (!propertyId) {
        return Promise.resolve([]);
      }

      return listHousekeepingTasks(propertyId, query);
    },
    [],
  );
}
