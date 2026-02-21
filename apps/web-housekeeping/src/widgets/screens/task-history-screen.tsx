'use client';

import { formatDateTime } from '../../shared/lib/utils/format';
import { useStaffSession } from '../../processes/auth/model/staff-session-context';
import { useHousekeepingTasksQuery } from '../../entities/housekeeping/model/use-housekeeping-tasks-query';
import { HousekeepingShell } from '../dashboard-shell/ui/housekeeping-shell';

function durationLabel(createdAt: string, completedAt?: string): string {
  if (!completedAt) {
    return '-';
  }

  const started = new Date(createdAt).getTime();
  const ended = new Date(completedAt).getTime();
  if (!Number.isFinite(started) || !Number.isFinite(ended) || ended <= started) {
    return '-';
  }

  const minutes = Math.round((ended - started) / 60000);
  return `${minutes}m`;
}

export default function TaskHistoryPage() {
  const { selectedPropertyId } = useStaffSession();
  const tasksQuery = useHousekeepingTasksQuery(selectedPropertyId);

  const completed = tasksQuery.data
    .filter((task) => Boolean(task.completedAt))
    .sort((a, b) => (a.completedAt ?? '') < (b.completedAt ?? '') ? 1 : -1);

  return (
    <HousekeepingShell title="Task History">
      <section className="card">
        {!selectedPropertyId ? <p className="auth-error">Select a property to view task history.</p> : null}
        {tasksQuery.isLoading ? <p className="note">Loading task history...</p> : null}
        {tasksQuery.error ? <p className="auth-error">{tasksQuery.error}</p> : null}

        {!tasksQuery.isLoading && !tasksQuery.error && completed.length === 0 ? (
          <p className="note">No completed tasks yet.</p>
        ) : null}

        {completed.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Task ID</th>
                <th>Room</th>
                <th>Completed By</th>
                <th>Completed At</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {completed.map((task) => (
                <tr key={task.id}>
                  <td>{task.id}</td>
                  <td>{task.roomNumber ?? task.roomId}</td>
                  <td>{task.assignedUserId ?? '-'}</td>
                  <td>{task.completedAt ? formatDateTime(task.completedAt) : '-'}</td>
                  <td>{durationLabel(task.createdAt, task.completedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>
    </HousekeepingShell>
  );
}
