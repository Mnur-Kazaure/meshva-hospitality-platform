'use client';

import { useMemo, useState } from 'react';
import { useStaffSession } from '../../processes/auth/model/staff-session-context';
import { useOwnerOperationsSummaryQuery } from '../../entities/owner-reporting/model/use-owner-operations-summary-query';
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

function topSource(sources: Record<string, number>): string {
  const sorted = Object.entries(sources).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] ?? '-';
}

export default function OperationsSnapshotPage() {
  const { selectedPropertyId } = useStaffSession();
  const [period, setPeriod] = useState<Period>('7d');
  const range = useMemo(() => toDateRange(period), [period]);

  const operationsQuery = useOwnerOperationsSummaryQuery({
    from: range.from,
    to: range.to,
    propertyIds: selectedPropertyId,
  });

  return (
    <OwnerShell title="Operations Snapshot (Read-only)">
      <div className="toolbar">
        <select className="select" value={period} onChange={(event) => setPeriod(event.target.value as Period)}>
          <option value="today">Today</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>

      <section className="card">
        {operationsQuery.isLoading ? <p className="note">Loading operations snapshot...</p> : null}
        {operationsQuery.error ? <p className="auth-error">{operationsQuery.error}</p> : null}
        {!operationsQuery.isLoading && !operationsQuery.error && operationsQuery.data.breakdownByProperty.length === 0 ? (
          <p className="note">No operations rows available.</p>
        ) : null}

        {operationsQuery.data.breakdownByProperty.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Arrivals</th>
                <th>Departures</th>
                <th>Dirty Backlog</th>
                <th>No-show</th>
                <th>Top Source</th>
              </tr>
            </thead>
            <tbody>
              {operationsQuery.data.breakdownByProperty.map((row) => (
                <tr key={row.propertyId}>
                  <td>{row.propertyName}</td>
                  <td>{row.arrivals}</td>
                  <td>{row.departures}</td>
                  <td>{row.dirtyBacklog.rooms}</td>
                  <td>{row.noShows}</td>
                  <td>{topSource(row.reservationSources)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>
    </OwnerShell>
  );
}
