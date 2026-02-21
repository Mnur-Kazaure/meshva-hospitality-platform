'use client';

import { useMemo, useState } from 'react';
import { formatDateTime } from '../../shared/lib/utils/format';
import { usePlatformAuditQuery } from '../../entities/platform-system/model/use-platform-system-query';
import { PlatformAdminShell } from '../dashboard-shell/ui/platform-admin-shell';

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

export default function GlobalAuditPage() {
  const [period, setPeriod] = useState<Period>('7d');
  const [tenantIds, setTenantIds] = useState('');
  const [action, setAction] = useState('');
  const range = useMemo(() => toDateRange(period), [period]);

  const auditQuery = usePlatformAuditQuery({
    from: range.from,
    to: range.to,
    tenantIds: tenantIds.trim() || undefined,
    action: action.trim() || undefined,
    limit: 200,
  });

  return (
    <PlatformAdminShell title="Global Audit Viewer">
      <div className="toolbar">
        <select className="select" value={period} onChange={(event) => setPeriod(event.target.value as Period)}>
          <option value="today">Today</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
        <input className="input" placeholder="tenantId1,tenantId2" value={tenantIds} onChange={(event) => setTenantIds(event.target.value)} />
        <input className="input" placeholder="Action filter" value={action} onChange={(event) => setAction(event.target.value)} />
      </div>

      <section className="card">
        {auditQuery.isLoading ? <p className="note">Loading global audit...</p> : null}
        {auditQuery.error ? <p className="auth-error">{auditQuery.error}</p> : null}
        {!auditQuery.isLoading && !auditQuery.error && auditQuery.data.length === 0 ? (
          <p className="note">No audit events found for current filters.</p>
        ) : null}

        {auditQuery.data.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Tenant</th>
              </tr>
            </thead>
            <tbody>
              {auditQuery.data.map((entry) => (
                <tr key={entry.id}>
                  <td>{formatDateTime(entry.createdAt)}</td>
                  <td>{entry.actorUserId ?? '-'}</td>
                  <td>{entry.action}</td>
                  <td>{entry.tenantId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>
    </PlatformAdminShell>
  );
}
