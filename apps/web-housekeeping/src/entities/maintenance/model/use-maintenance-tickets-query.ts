'use client';

import type { ListMaintenanceTicketsDto, MaintenanceTicketDto } from '../../../shared/types/contracts';
import { useAsyncQuery } from '../../../shared/lib/hooks/use-async-query';
import { listMaintenanceTickets } from '../api/maintenance-api';

export function useMaintenanceTicketsQuery(propertyId?: string, query?: ListMaintenanceTicketsDto) {
  const queryKey = JSON.stringify(query ?? {});
  return useAsyncQuery<MaintenanceTicketDto[]>(
    `maintenance-tickets:${propertyId ?? 'none'}:${queryKey}`,
    () => {
      if (!propertyId) {
        return Promise.resolve([]);
      }

      return listMaintenanceTickets(propertyId, query);
    },
    [],
  );
}
