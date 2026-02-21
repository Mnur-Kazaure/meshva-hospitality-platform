import type { MaintenanceSeverity } from '../../enums/maintenance-severity';

export interface CreateMaintenanceTicketDto {
  roomId: string;
  title: string;
  description: string;
  severity: MaintenanceSeverity;
  photoUrl?: string;
}
