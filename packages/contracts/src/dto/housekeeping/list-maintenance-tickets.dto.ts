import type { MaintenanceSeverity } from '../../enums/maintenance-severity';
import type { MaintenanceTicketStatus } from '../../enums/maintenance-ticket-status';

export interface ListMaintenanceTicketsDto {
  status?: MaintenanceTicketStatus;
  severity?: MaintenanceSeverity;
  roomId?: string;
}
