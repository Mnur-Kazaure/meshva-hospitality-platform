'use client';

import { useMemo, useState } from 'react';
import { formatCurrency, formatDateTime } from '../../shared/lib/utils/format';
import { useStaffSession } from '../../processes/auth/model/staff-session-context';
import { useOwnerPropertiesQuery } from '../../entities/owner-reporting/model/use-owner-properties-query';
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

export default function PropertiesPage() {
  const { selectedPropertyId } = useStaffSession();
  const [period, setPeriod] = useState<Period>('7d');
  const range = useMemo(() => toDateRange(period), [period]);

  const propertiesQuery = useOwnerPropertiesQuery({
    from: range.from,
    to: range.to,
    propertyIds: selectedPropertyId,
  });

  return (
    <OwnerShell title="Properties Comparison">
      <div className="toolbar">
        <select className="select" value={period} onChange={(event) => setPeriod(event.target.value as Period)}>
          <option value="today">Today</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
        <button className="btn secondary" onClick={() => void propertiesQuery.refetch()}>
          Refresh
        </button>
      </div>

      <section className="card">
        {propertiesQuery.isLoading ? <p className="note">Loading properties comparison...</p> : null}
        {propertiesQuery.error ? <p className="auth-error">{propertiesQuery.error}</p> : null}
        {!propertiesQuery.isLoading && !propertiesQuery.error && propertiesQuery.data.rows.length === 0 ? (
          <p className="note">No properties available in this scope.</p>
        ) : null}
        {propertiesQuery.data.rows.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Revenue</th>
                <th>Occupancy</th>
                <th>Outstanding</th>
                <th>Compliance</th>
                <th>Exceptions</th>
                <th>Last Close</th>
              </tr>
            </thead>
            <tbody>
              {propertiesQuery.data.rows.map((row) => (
                <tr key={row.propertyId}>
                  <td>{row.propertyName}</td>
                  <td>{formatCurrency(row.revenue)}</td>
                  <td>{row.occupancy}%</td>
                  <td>{formatCurrency(row.outstandingBalance)}</td>
                  <td>{row.closeCompliance}%</td>
                  <td>{row.exceptionsCount}</td>
                  <td>{row.lastDailyCloseAt ? formatDateTime(row.lastDailyCloseAt) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>
    </OwnerShell>
  );
}
