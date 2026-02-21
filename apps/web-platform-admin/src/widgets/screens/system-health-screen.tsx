'use client';

import { usePlatformSystemHealthQuery } from '../../entities/platform-system/model/use-platform-system-query';
import { PlatformAdminShell } from '../dashboard-shell/ui/platform-admin-shell';

export default function SystemHealthPage() {
  const healthQuery = usePlatformSystemHealthQuery();

  return (
    <PlatformAdminShell title="System Health">
      {healthQuery.isLoading ? <p className="note">Loading system health...</p> : null}
      {healthQuery.error ? <p className="auth-error">{healthQuery.error}</p> : null}

      <div className="grid cols-4">
        <section className="card"><div>API Uptime</div><div className="kpi">{healthQuery.data.api.uptimeSeconds}s</div></section>
        <section className="card"><div>Queue Backlog</div><div className="kpi">{healthQuery.data.queues.backlog}</div></section>
        <section className="card"><div>Failed Jobs</div><div className="kpi">{healthQuery.data.queues.failedJobs}</div></section>
        <section className="card"><div>Active Tenants</div><div className="kpi">{healthQuery.data.tenants.active}</div></section>
      </div>
    </PlatformAdminShell>
  );
}
