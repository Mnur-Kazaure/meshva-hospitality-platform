import type { HousekeepingTaskStatus } from '../../enums/housekeeping-task-status';

export interface ListHousekeepingTasksDto {
  status?: HousekeepingTaskStatus;
  assignedUserId?: string;
  roomId?: string;
  mine?: boolean;
}
