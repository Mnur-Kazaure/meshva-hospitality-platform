'use client';

import { HousekeepingTaskStatus } from '../../shared/types/contracts';
import { useStaffSession } from '../../processes/auth/model/staff-session-context';
import { useHousekeepingTasksQuery } from '../../entities/housekeeping/model/use-housekeeping-tasks-query';
import {
  useMarkHousekeepingTaskCleanMutation,
  useMarkHousekeepingTaskReadyMutation,
  useStartHousekeepingTaskMutation,
} from '../../features/housekeeping-task-transition/model/use-housekeeping-task-transition';
import { HousekeepingShell } from '../dashboard-shell/ui/housekeeping-shell';

function taskStatusClass(status: HousekeepingTaskStatus): string {
  if (status === HousekeepingTaskStatus.DIRTY) {
    return 'dirty';
  }
  if (status === HousekeepingTaskStatus.CLEANING) {
    return 'cleaning';
  }
  if (status === HousekeepingTaskStatus.CLEAN) {
    return 'clean';
  }
  return 'ready';
}

export default function MyTasksPage() {
  const { selectedPropertyId } = useStaffSession();
  const tasksQuery = useHousekeepingTasksQuery(selectedPropertyId, { mine: true });
  const startMutation = useStartHousekeepingTaskMutation();
  const markCleanMutation = useMarkHousekeepingTaskCleanMutation();
  const markReadyMutation = useMarkHousekeepingTaskReadyMutation();

  const runTransition = async (taskId: string, status: HousekeepingTaskStatus) => {
    if (!selectedPropertyId) {
      return;
    }

    const mutation =
      status === HousekeepingTaskStatus.DIRTY
        ? startMutation
        : status === HousekeepingTaskStatus.CLEANING
          ? markCleanMutation
          : markReadyMutation;

    const result = await mutation.mutate({ propertyId: selectedPropertyId, taskId });
    if (!result) {
      return;
    }

    await tasksQuery.refetch();
  };

  const mutationError = startMutation.error ?? markCleanMutation.error ?? markReadyMutation.error;

  return (
    <HousekeepingShell title="My Tasks">
      <section className="card">
        {!selectedPropertyId ? <p className="auth-error">Select a property to load your assigned tasks.</p> : null}
        {mutationError ? <p className="auth-error">{mutationError}</p> : null}
        {tasksQuery.isLoading ? <p className="note">Loading assigned tasks...</p> : null}
        {tasksQuery.error ? <p className="auth-error">{tasksQuery.error}</p> : null}

        {!tasksQuery.isLoading && !tasksQuery.error && tasksQuery.data.length === 0 ? (
          <p className="note">No assigned tasks yet.</p>
        ) : null}

        {tasksQuery.data.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Room</th>
                <th>Task</th>
                <th>Status</th>
                <th>Aging</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tasksQuery.data.map((task) => {
                const actionLabel =
                  task.status === HousekeepingTaskStatus.DIRTY
                    ? 'Start Cleaning'
                    : task.status === HousekeepingTaskStatus.CLEANING
                      ? 'Mark Clean'
                      : task.status === HousekeepingTaskStatus.CLEAN
                        ? 'Mark Ready'
                        : null;

                return (
                  <tr key={task.id}>
                    <td>{task.roomNumber ?? task.roomId}</td>
                    <td>{task.note || 'Post-checkout clean'}</td>
                    <td>
                      <span className={`status-pill ${taskStatusClass(task.status)}`}>{task.status}</span>
                    </td>
                    <td>{task.dirtySinceMinutes ? `${task.dirtySinceMinutes}m` : '-'}</td>
                    <td>
                      {actionLabel ? (
                        <button
                          className={task.status === HousekeepingTaskStatus.DIRTY ? 'btn primary' : 'btn secondary'}
                          onClick={() => void runTransition(task.id, task.status)}
                        >
                          {actionLabel}
                        </button>
                      ) : (
                        <span className="note">Completed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : null}
      </section>
    </HousekeepingShell>
  );
}
