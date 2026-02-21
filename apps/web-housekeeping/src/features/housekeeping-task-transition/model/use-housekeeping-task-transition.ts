'use client';

import type { HousekeepingTaskTransitionResponseDto } from '../../../shared/types/contracts';
import { useAsyncMutation } from '../../../shared/lib/hooks/use-async-mutation';
import {
  markHousekeepingTaskClean,
  markHousekeepingTaskReady,
  startHousekeepingTask,
} from '../../../entities/housekeeping/api/housekeeping-api';

interface TaskTransitionInput {
  propertyId: string;
  taskId: string;
}

export function useStartHousekeepingTaskMutation() {
  return useAsyncMutation<TaskTransitionInput, HousekeepingTaskTransitionResponseDto>(
    ({ propertyId, taskId }) => startHousekeepingTask(propertyId, taskId),
    {
      invalidatePrefixes: ['housekeeping-tasks:', 'housekeeping-room-status:', 'maintenance-tickets:'],
    },
  );
}

export function useMarkHousekeepingTaskCleanMutation() {
  return useAsyncMutation<TaskTransitionInput, HousekeepingTaskTransitionResponseDto>(
    ({ propertyId, taskId }) => markHousekeepingTaskClean(propertyId, taskId),
    {
      invalidatePrefixes: ['housekeeping-tasks:', 'housekeeping-room-status:', 'maintenance-tickets:'],
    },
  );
}

export function useMarkHousekeepingTaskReadyMutation() {
  return useAsyncMutation<TaskTransitionInput, HousekeepingTaskTransitionResponseDto>(
    ({ propertyId, taskId }) => markHousekeepingTaskReady(propertyId, taskId),
    {
      invalidatePrefixes: ['housekeeping-tasks:', 'housekeeping-room-status:', 'maintenance-tickets:'],
    },
  );
}
