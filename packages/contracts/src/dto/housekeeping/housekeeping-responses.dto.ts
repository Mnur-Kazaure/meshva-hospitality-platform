import type { HousekeepingTaskStatus } from '../../enums/housekeeping-task-status';
import type { MaintenanceSeverity } from '../../enums/maintenance-severity';
import type { MaintenanceTicketStatus } from '../../enums/maintenance-ticket-status';
import type { RoomStatus } from '../../enums/room-status';

export interface HousekeepingTaskDto {
  id: string;
  tenantId: string;
  propertyId: string;
  roomId: string;
  stayId?: string;
  status: HousekeepingTaskStatus;
  assignedUserId?: string;
  note: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  roomNumber?: string;
  roomStatus?: RoomStatus;
  roomType?: string;
  dirtySinceMinutes?: number;
}

export interface HousekeepingTaskTransitionResponseDto {
  task: HousekeepingTaskDto;
  room: {
    id: string;
    tenantId: string;
    propertyId: string;
    roomTypeId: string;
    roomNumber: string;
    status: RoomStatus;
  };
}

export interface HousekeepingRoomStatusBoardItemDto {
  roomId: string;
  roomNumber: string;
  roomType?: string;
  roomStatus: RoomStatus;
  activeTaskStatus?: HousekeepingTaskStatus;
  assignedUserId?: string;
  taskId?: string;
}

export interface MaintenanceTicketDto {
  id: string;
  tenantId: string;
  propertyId: string;
  roomId: string;
  title: string;
  description: string;
  severity: MaintenanceSeverity;
  status: MaintenanceTicketStatus;
  photoUrl?: string;
  reportedByUserId: string;
  resolvedByUserId?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}
