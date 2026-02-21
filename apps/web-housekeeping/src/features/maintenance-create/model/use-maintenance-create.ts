'use client';

import type { CreateMaintenanceTicketDto, MaintenanceTicketDto } from '../../../shared/types/contracts';
import { useAsyncMutation } from '../../../shared/lib/hooks/use-async-mutation';
import { createMaintenanceTicket } from '../../../entities/maintenance/api/maintenance-api';

interface MaintenanceCreateInput {
  propertyId: string;
  dto: CreateMaintenanceTicketDto;
}

export function useMaintenanceCreateMutation() {
  return useAsyncMutation<MaintenanceCreateInput, MaintenanceTicketDto>(
    ({ propertyId, dto }) => createMaintenanceTicket(propertyId, dto),
    {
      invalidatePrefixes: ['maintenance-tickets:', 'housekeeping-room-status:'],
    },
  );
}
