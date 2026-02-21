'use client';

import { useMemo, useState } from 'react';
import { formatCurrency } from '../../shared/lib/utils/format';
import { useStaffSession } from '../../processes/auth/model/staff-session-context';
import { useOwnerFinancialSummaryQuery } from '../../entities/owner-reporting/model/use-owner-financial-summary-query';
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

export default function FinancialSummaryPage() {
  const { selectedPropertyId } = useStaffSession();
  const [period, setPeriod] = useState<Period>('7d');
  const range = useMemo(() => toDateRange(period), [period]);

  const financialQuery = useOwnerFinancialSummaryQuery({
    from: range.from,
    to: range.to,
    propertyIds: selectedPropertyId,
  });

  return (
    <OwnerShell title="Financial Summary (Read-only)">
      <div className="toolbar">
        <select className="select" value={period} onChange={(event) => setPeriod(event.target.value as Period)}>
          <option value="today">Today</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>

      <div className="grid cols-4">
        <section className="card"><div>Cash</div><div className="kpi">{formatCurrency(financialQuery.data.totals.revenueByMethod.cash)}</div></section>
        <section className="card"><div>Transfer</div><div className="kpi">{formatCurrency(financialQuery.data.totals.revenueByMethod.transfer)}</div></section>
        <section className="card"><div>POS</div><div className="kpi">{formatCurrency(financialQuery.data.totals.revenueByMethod.pos)}</div></section>
        <section className="card"><div>Net Revenue</div><div className="kpi">{formatCurrency(financialQuery.data.totals.netRevenue)}</div></section>
      </div>

      <section className="card" style={{ marginTop: 12 }}>
        {financialQuery.isLoading ? <p className="note">Loading financial summary...</p> : null}
        {financialQuery.error ? <p className="auth-error">{financialQuery.error}</p> : null}
        {!financialQuery.isLoading && !financialQuery.error && financialQuery.data.breakdownByProperty.length === 0 ? (
          <p className="note">No financial rows available.</p>
        ) : null}
        {financialQuery.data.breakdownByProperty.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Cash</th>
                <th>Transfer</th>
                <th>POS</th>
                <th>Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {financialQuery.data.breakdownByProperty.map((row) => (
                <tr key={row.propertyId}>
                  <td>{row.propertyName}</td>
                  <td>{formatCurrency(row.revenueByMethod.cash)}</td>
                  <td>{formatCurrency(row.revenueByMethod.transfer)}</td>
                  <td>{formatCurrency(row.revenueByMethod.pos)}</td>
                  <td>{formatCurrency(row.outstandingBalance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>
    </OwnerShell>
  );
}
