import { MaintenanceSeverity, MaintenanceTicketStatus } from '@meshva/contracts';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export class ListMaintenanceTicketsDto {
  @IsOptional()
  @IsEnum(MaintenanceTicketStatus)
  status?: MaintenanceTicketStatus;

  @IsOptional()
  @IsEnum(MaintenanceSeverity)
  severity?: MaintenanceSeverity;

  @IsOptional()
  @IsUUID()
  roomId?: string;
}
