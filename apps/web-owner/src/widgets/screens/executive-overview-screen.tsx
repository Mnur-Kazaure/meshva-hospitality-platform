'use client';

import { useMemo, useState } from 'react';
import { formatCurrency, formatDateTime } from '../../shared/lib/utils/format';
import { useStaffSession } from '../../processes/auth/model/staff-session-context';
import { useOwnerOverviewQuery } from '../../entities/owner-reporting/model/use-owner-overview-query';
import { useOwnerExceptionsQuery } from '../../entities/owner-exceptions/model/use-owner-exceptions-query';
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

export default function ExecutiveOverviewPage() {
  const { selectedPropertyId } = useStaffSession();
  const [period, setPeriod] = useState<Period>('7d');
  const range = useMemo(() => toDateRange(period), [period]);
  const propertyIds = selectedPropertyId ? selectedPropertyId : undefined;

  const overviewQuery = useOwnerOverviewQuery({
    from: range.from,
    to: range.to,
    propertyIds,
  });
  const exceptionsQuery = useOwnerExceptionsQuery({
    from: range.from,
    to: range.to,
    propertyIds,
  });

  const topExceptions = exceptionsQuery.data.exceptions.slice(0, 5);

  return (
    <OwnerShell title="Executive Overview">
      <div className="toolbar">
        <select className="select" value={period} onChange={(event) => setPeriod(event.target.value as Period)}>
          <option value="today">Today</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>

      {overviewQuery.isLoading ? <p className="note">Loading portfolio overview...</p> : null}
      {overviewQuery.error ? <p className="auth-error">{overviewQuery.error}</p> : null}

      <div className="grid cols-5">
        <section className="card"><div>Total Revenue</div><div className="kpi">{formatCurrency(overviewQuery.data.totals.revenue)}</div></section>
        <section className="card"><div>Occupancy</div><div className="kpi">{overviewQuery.data.totals.occupancy}%</div></section>
        <section className="card"><div>Outstanding</div><div className="kpi">{formatCurrency(overviewQuery.data.totals.outstandingBalance)}</div></section>
        <section className="card"><div>Close Compliance</div><div className="kpi">{overviewQuery.data.totals.closeCompliance}%</div></section>
        <section className="card"><div>Exceptions</div><div className="kpi">{overviewQuery.data.totals.exceptionsCount}</div></section>
      </div>

      <div className="grid cols-2" style={{ marginTop: 12 }}>
        <section className="card">
          <h3>Risk Center</h3>
          {exceptionsQuery.isLoading ? <p className="note">Loading exceptions...</p> : null}
          {exceptionsQuery.error ? <p className="auth-error">{exceptionsQuery.error}</p> : null}
          {!exceptionsQuery.isLoading && !exceptionsQuery.error && topExceptions.length === 0 ? (
            <p className="note">No exceptions raised in this period.</p>
          ) : null}
          {topExceptions.length > 0 ? (
            <ul className="list">
              {topExceptions.map((exception) => (
                <li key={exception.id}>
                  <strong>{exception.type}</strong> at {exception.propertyId ?? 'Portfolio'} ({exception.severity})
                </li>
              ))}
            </ul>
          ) : null}
        </section>
        <section className="card">
          <h3>Portfolio Breakdown</h3>
          {!overviewQuery.isLoading && overviewQuery.data.breakdownByProperty.length === 0 ? (
            <p className="note">No property metrics available for this range.</p>
          ) : null}
          {overviewQuery.data.breakdownByProperty.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Revenue</th>
                  <th>Occupancy</th>
                  <th>Compliance</th>
                </tr>
              </thead>
              <tbody>
                {overviewQuery.data.breakdownByProperty.map((row) => (
                  <tr key={row.propertyId}>
                    <td>{row.propertyName}</td>
                    <td>{formatCurrency(row.revenue)}</td>
                    <td>{row.occupancy}%</td>
                    <td>{row.closeCompliance}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
          <p className="note">Updated {formatDateTime(new Date().toISOString())}</p>
        </section>
      </div>
    </OwnerShell>
  );
}
