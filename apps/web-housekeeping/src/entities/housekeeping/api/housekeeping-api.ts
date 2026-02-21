import type {
  HousekeepingRoomStatusBoardItemDto,
  HousekeepingTaskDto,
  HousekeepingTaskTransitionResponseDto,
  ListHousekeepingTasksDto,
} from '../../../shared/types/contracts';
import { apiClient } from '../../../shared/lib/api/client';

function toTaskQuery(query?: ListHousekeepingTasksDto): string {
  const params = new URLSearchParams();
  if (query?.status) {
    params.set('status', query.status);
  }
  if (query?.assignedUserId) {
    params.set('assignedUserId', query.assignedUserId);
  }
  if (query?.roomId) {
    params.set('roomId', query.roomId);
  }
  if (query?.mine) {
    params.set('mine', 'true');
  }

  const payload = params.toString();
  return payload ? `?${payload}` : '';
}

export function listHousekeepingTasks(
  propertyId: string,
  query?: ListHousekeepingTasksDto,
): Promise<HousekeepingTaskDto[]> {
  return apiClient.get<HousekeepingTaskDto[]>(
    `/properties/${propertyId}/housekeeping/tasks${toTaskQuery(query)}`,
  );
}

export function getRoomStatusBoard(
  propertyId: string,
): Promise<HousekeepingRoomStatusBoardItemDto[]> {
  return apiClient.get<HousekeepingRoomStatusBoardItemDto[]>(
    `/properties/${propertyId}/housekeeping/rooms/status-board`,
  );
}

export function startHousekeepingTask(
  propertyId: string,
  taskId: string,
): Promise<HousekeepingTaskTransitionResponseDto> {
  return apiClient.post<HousekeepingTaskTransitionResponseDto>(
    `/properties/${propertyId}/housekeeping/tasks/${taskId}/start`,
    {},
    'housekeeping-task-start',
  );
}

export function markHousekeepingTaskClean(
  propertyId: string,
  taskId: string,
): Promise<HousekeepingTaskTransitionResponseDto> {
  return apiClient.post<HousekeepingTaskTransitionResponseDto>(
    `/properties/${propertyId}/housekeeping/tasks/${taskId}/mark-clean`,
    {},
    'housekeeping-task-mark-clean',
  );
}

export function markHousekeepingTaskReady(
  propertyId: string,
  taskId: string,
): Promise<HousekeepingTaskTransitionResponseDto> {
  return apiClient.post<HousekeepingTaskTransitionResponseDto>(
    `/properties/${propertyId}/housekeeping/tasks/${taskId}/mark-ready`,
    {},
    'housekeeping-task-mark-ready',
  );
}
