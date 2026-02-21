'use client';

import { useMemo, useState } from 'react';
import { usePlatformTenantsQuery } from '../../entities/platform-tenants/model/use-platform-tenants-query';
import { PlatformAdminShell } from '../dashboard-shell/ui/platform-admin-shell';

type TenantStatusFilter = 'all' | 'active' | 'suspended' | 'pending';

export default function TenantsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<TenantStatusFilter>('active');

  const tenantsQuery = usePlatformTenantsQuery({
    status: status === 'all' ? undefined : status,
  });

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return tenantsQuery.data.rows;
    }

    return tenantsQuery.data.rows.filter((tenant) => {
      const haystack = [
        tenant.name,
        tenant.primaryEmail,
        tenant.primaryPhone,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [search, tenantsQuery.data.rows]);

  return (
    <PlatformAdminShell title="Tenants">
      <div className="toolbar">
        <input
          className="input"
          placeholder="Search tenant by name or contact"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select className="select" value={status} onChange={(event) => setStatus(event.target.value as TenantStatusFilter)}>
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="pending">Pending</option>
        </select>
      </div>
      <section className="card">
        {tenantsQuery.isLoading ? <p className="note">Loading tenants...</p> : null}
        {tenantsQuery.error ? <p className="auth-error">{tenantsQuery.error}</p> : null}

        {!tenantsQuery.isLoading && !tenantsQuery.error && rows.length === 0 ? (
          <p className="note">No tenants found for selected filters.</p>
        ) : null}

        {rows.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Status</th>
                <th>Plan</th>
                <th>Properties</th>
                <th>Contact</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((tenant) => (
                <tr key={tenant.id}>
                  <td>{tenant.name}</td>
                  <td>{tenant.status.toUpperCase()}</td>
                  <td>{tenant.activePlan?.name ?? '-'}</td>
                  <td>{tenant.propertiesCount}</td>
                  <td>{tenant.primaryEmail ?? tenant.primaryPhone ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>
    </PlatformAdminShell>
  );
}
