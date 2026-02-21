'use client';

import { useMemo, useState } from 'react';
import { HousekeepingTaskStatus } from '../../shared/types/contracts';
import { useStaffSession } from '../../processes/auth/model/staff-session-context';
import { useHousekeepingTasksQuery } from '../../entities/housekeeping/model/use-housekeeping-tasks-query';
import { useRoomStatusBoardQuery } from '../../entities/housekeeping/model/use-room-status-board-query';
import {
  useMarkHousekeepingTaskCleanMutation,
  useMarkHousekeepingTaskReadyMutation,
  useStartHousekeepingTaskMutation,
} from '../../features/housekeeping-task-transition/model/use-housekeeping-task-transition';
import { HousekeepingShell } from '../dashboard-shell/ui/housekeeping-shell';

function statusClass(status: HousekeepingTaskStatus): string {
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

export default function TaskBoardPage() {
  const { selectedPropertyId } = useStaffSession();
  const tasksQuery = useHousekeepingTasksQuery(selectedPropertyId);
  const roomBoardQuery = useRoomStatusBoardQuery(selectedPropertyId);
  const startMutation = useStartHousekeepingTaskMutation();
  const markCleanMutation = useMarkHousekeepingTaskCleanMutation();
  const markReadyMutation = useMarkHousekeepingTaskReadyMutation();

  const [feedback, setFeedback] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const tasks = useMemo(
    () => tasksQuery.data.slice().sort((a, b) => (b.dirtySinceMinutes ?? 0) - (a.dirtySinceMinutes ?? 0)),
    [tasksQuery.data],
  );

  const metrics = useMemo(
    () => ({
      dirty: tasks.filter((task) => task.status === HousekeepingTaskStatus.DIRTY).length,
      cleaning: tasks.filter((task) => task.status === HousekeepingTaskStatus.CLEANING).length,
      clean: tasks.filter((task) => task.status === HousekeepingTaskStatus.CLEAN).length,
      priority: tasks.filter((task) => task.note.toUpperCase().includes('VIP')).length,
    }),
    [tasks],
  );

  const runTransition = async (taskId: string, status: HousekeepingTaskStatus) => {
    if (!selectedPropertyId) {
      return;
    }

    setFeedback(null);
    setActiveTaskId(taskId);

    const mutation =
      status === HousekeepingTaskStatus.DIRTY
        ? startMutation
        : status === HousekeepingTaskStatus.CLEANING
          ? markCleanMutation
          : markReadyMutation;

    const result = await mutation.mutate({ propertyId: selectedPropertyId, taskId });
    setActiveTaskId(null);

    if (!result) {
      return;
    }

    setFeedback(`Room ${result.room.roomNumber} updated to ${result.task.status}.`);
    await Promise.all([tasksQuery.refetch(), roomBoardQuery.refetch()]);
  };

  const mutationError = startMutation.error ?? markCleanMutation.error ?? markReadyMutation.error;

  return (
    <HousekeepingShell title="Task Board (Today)">
      <div className="grid cols-4">
        <section className="card">
          <div>Dirty Rooms</div>
          <div className="kpi">{metrics.dirty}</div>
        </section>
        <section className="card">
          <div>In Cleaning</div>
          <div className="kpi">{metrics.cleaning}</div>
        </section>
        <section className="card">
          <div>Clean Pending Ready</div>
          <div className="kpi">{metrics.clean}</div>
        </section>
        <section className="card">
          <div>Priority Tasks</div>
          <div className="kpi">{metrics.priority}</div>
        </section>
      </div>

      <section className="card" style={{ marginTop: 12 }}>
        {!selectedPropertyId ? <p className="auth-error">Select a property to load housekeeping tasks.</p> : null}
        {feedback ? <div className="alert">{feedback}</div> : null}
        {mutationError ? <p className="auth-error">{mutationError}</p> : null}
        {tasksQuery.isLoading ? <p className="note">Loading task board...</p> : null}
        {tasksQuery.error ? <p className="auth-error">{tasksQuery.error}</p> : null}

        {!tasksQuery.isLoading && !tasksQuery.error && tasks.length === 0 ? (
          <p className="note">No housekeeping tasks available for this property.</p>
        ) : null}

        {tasks.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Room</th>
                <th>Status</th>
                <th>Assigned</th>
                <th>Dirty Since</th>
                <th>Priority</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => {
                const canAct =
                  task.status === HousekeepingTaskStatus.DIRTY ||
                  task.status === HousekeepingTaskStatus.CLEANING ||
                  task.status === HousekeepingTaskStatus.CLEAN;

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
                    <td>
                      <span className={`status-pill ${statusClass(task.status)}`}>{task.status}</span>
                    </td>
                    <td>{task.assignedUserId ?? '-'}</td>
                    <td>{task.dirtySinceMinutes ? `${task.dirtySinceMinutes}m` : '-'}</td>
                    <td>{task.note.toUpperCase().includes('VIP') ? <span className="status-pill alert">VIP</span> : '-'}</td>
                    <td>
                      {canAct && actionLabel ? (
                        <button
                          className={task.status === HousekeepingTaskStatus.DIRTY ? 'btn primary' : 'btn secondary'}
                          onClick={() => void runTransition(task.id, task.status)}
                          disabled={activeTaskId === task.id}
                        >
                          {activeTaskId === task.id ? 'Saving...' : actionLabel}
                        </button>
                      ) : (
                        <span className="note">-</span>
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
