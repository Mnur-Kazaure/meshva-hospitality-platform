'use client';

import { useState } from 'react';
import { formatCurrency } from '../../shared/lib/utils/format';
import { usePlatformTenantMetricsQuery } from '../../entities/platform-tenants/model/use-platform-tenants-query';
import { PlatformAdminShell } from '../dashboard-shell/ui/platform-admin-shell';

export default function PlatformMetricsPage() {
  const [tenantId, setTenantId] = useState(process.env.NEXT_PUBLIC_TENANT_ID ?? '');
  const metricsQuery = usePlatformTenantMetricsQuery(tenantId.trim() || undefined);

  return (
    <PlatformAdminShell title="Platform Metrics">
      <div className="toolbar">
        <input
          className="input"
          placeholder="Tenant ID"
          value={tenantId}
          onChange={(event) => setTenantId(event.target.value)}
        />
        <button className="btn secondary" onClick={() => void metricsQuery.refetch()} disabled={!tenantId.trim()}>
          Load Metrics
        </button>
      </div>
      <section className="card">
        {metricsQuery.isLoading ? <p className="note">Loading tenant metrics...</p> : null}
        {metricsQuery.error ? <p className="auth-error">{metricsQuery.error}</p> : null}

        {!tenantId.trim() ? <p className="note">Enter a tenant ID to load metrics.</p> : null}

        {!metricsQuery.isLoading && !metricsQuery.error && tenantId.trim() ? (
          <table className="table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Active Properties</td><td>{metricsQuery.data.activeProperties}</td></tr>
              <tr><td>Active Users</td><td>{metricsQuery.data.activeUsers}</td></tr>
              <tr><td>Reservations (last 7d)</td><td>{metricsQuery.data.reservationsLast7d}</td></tr>
              <tr><td>Revenue (last 7d)</td><td>{formatCurrency(metricsQuery.data.revenueLast7d)}</td></tr>
            </tbody>
          </table>
        ) : null}
      </section>
    </PlatformAdminShell>
  );
}
