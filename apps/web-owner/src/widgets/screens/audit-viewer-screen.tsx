'use client';

import { useMemo, useState } from 'react';
import { formatDateTime } from '../../shared/lib/utils/format';
import { useStaffSession } from '../../processes/auth/model/staff-session-context';
import { useOwnerAuditQuery } from '../../entities/owner-audit/model/use-owner-audit-query';
import { OwnerShell } from '../dashboard-shell/ui/owner-shell';

type Period = 'today' | '7d' | '30d';

function shiftDateByDays(baseDate: string, delta: number): string {
  const value = new Date(`${baseDate}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + delta);
  return value.toISOString().slice(0, 10);
}

function toDateRange(period: Period) {
  const to = new Date().toISOString().slice(0, 10);
  if (period === 'today') {
    return { from: to, to };
  }

  return {
    from: shiftDateByDays(to, period === '7d' ? -6 : -29),
    to,
  };
}

export default function AuditViewerPage() {
  const { selectedPropertyId } = useStaffSession();
  const [period, setPeriod] = useState<Period>('7d');
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const range = useMemo(() => toDateRange(period), [period]);

  const auditQuery = useOwnerAuditQuery({
    from: range.from,
    to: range.to,
    propertyIds: selectedPropertyId,
    action: action.trim() || undefined,
    entityType: entityType.trim() || undefined,
    limit: 150,
  });

  return (
    <OwnerShell title="Audit Viewer (Read-only)">
      <div className="toolbar">
        <select className="select" value={period} onChange={(event) => setPeriod(event.target.value as Period)}>
          <option value="today">Today</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
        <input
          className="input"
          placeholder="Action filter"
          value={action}
          onChange={(event) => setAction(event.target.value)}
        />
        <input
          className="input"
          placeholder="Entity type"
          value={entityType}
          onChange={(event) => setEntityType(event.target.value)}
        />
      </div>

      <section className="card">
        {auditQuery.isLoading ? <p className="note">Loading audit logs...</p> : null}
        {auditQuery.error ? <p className="auth-error">{auditQuery.error}</p> : null}
        {!auditQuery.isLoading && !auditQuery.error && auditQuery.data.length === 0 ? (
          <p className="note">No audit entries for the selected filters.</p>
        ) : null}

        {auditQuery.data.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Property</th>
              </tr>
            </thead>
            <tbody>
              {auditQuery.data.map((entry) => (
                <tr key={entry.id}>
                  <td>{formatDateTime(entry.createdAt)}</td>
                  <td>{entry.actorUserId ?? '-'}</td>
                  <td>{entry.action}</td>
                  <td>{entry.entityType}</td>
                  <td>{entry.propertyId ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>
    </OwnerShell>
  );
}
