import type {
  CreateMaintenanceTicketDto,
  ListMaintenanceTicketsDto,
  MaintenanceTicketDto,
} from '../../../shared/types/contracts';
import { apiClient } from '../../../shared/lib/api/client';

function toMaintenanceQuery(query?: ListMaintenanceTicketsDto): string {
  const params = new URLSearchParams();
  if (query?.status) {
    params.set('status', query.status);
  }
  if (query?.severity) {
    params.set('severity', query.severity);
  }
  if (query?.roomId) {
    params.set('roomId', query.roomId);
  }

  const payload = params.toString();
  return payload ? `?${payload}` : '';
}

export function listMaintenanceTickets(
  propertyId: string,
  query?: ListMaintenanceTicketsDto,
): Promise<MaintenanceTicketDto[]> {
  return apiClient.get<MaintenanceTicketDto[]>(
    `/properties/${propertyId}/maintenance${toMaintenanceQuery(query)}`,
  );
}

export function createMaintenanceTicket(
  propertyId: string,
  dto: CreateMaintenanceTicketDto,
): Promise<MaintenanceTicketDto> {
  return apiClient.post<MaintenanceTicketDto>(
    `/properties/${propertyId}/maintenance`,
    dto,
    'maintenance-create',
  );
}
