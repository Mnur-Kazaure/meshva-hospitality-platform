'use client';

import { FormEvent, useState } from 'react';
import { usePlatformTenantFeatureFlagsQuery } from '../../entities/platform-tenants/model/use-platform-tenants-query';
import { useUpsertPlatformFeatureFlagMutation } from '../../features/platform-tenant-actions/model/use-platform-tenant-actions';
import { PlatformAdminShell } from '../dashboard-shell/ui/platform-admin-shell';

export default function FeatureFlagsPage() {
  const [tenantId, setTenantId] = useState('');
  const [flagKey, setFlagKey] = useState('kitchen_enabled');
  const [enabled, setEnabled] = useState(true);

  const flagsQuery = usePlatformTenantFeatureFlagsQuery(tenantId.trim() || undefined);
  const upsertMutation = useUpsertPlatformFeatureFlagMutation();

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!tenantId.trim()) {
      return;
    }

    const updated = await upsertMutation.mutate({
      tenantId: tenantId.trim(),
      dto: {
        key: flagKey.trim(),
        enabled,
      },
    });

    if (!updated) {
      return;
    }

    await flagsQuery.refetch();
  };

  return (
    <PlatformAdminShell title="Feature Flags (Tenant Level)">
      <section className="card">
        <form className="form-grid" onSubmit={onSubmit}>
          <label>
            Tenant ID
            <input className="input" value={tenantId} onChange={(event) => setTenantId(event.target.value)} required />
          </label>
          <label>
            Flag Key
            <input className="input" value={flagKey} onChange={(event) => setFlagKey(event.target.value)} required />
          </label>
          <label>
            Enabled
            <select className="select" value={enabled ? 'true' : 'false'} onChange={(event) => setEnabled(event.target.value === 'true')}>
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          </label>
          <div className="toolbar" style={{ gridColumn: '1 / -1' }}>
            <button className="btn primary" type="submit" disabled={upsertMutation.isPending}>
              {upsertMutation.isPending ? 'Saving...' : 'Save Feature Flag'}
            </button>
          </div>
        </form>
        {upsertMutation.error ? <p className="auth-error">{upsertMutation.error}</p> : null}
      </section>

      <section className="card" style={{ marginTop: 12 }}>
        <h3>Tenant Feature Flags</h3>
        {flagsQuery.isLoading ? <p className="note">Loading flags...</p> : null}
        {flagsQuery.error ? <p className="auth-error">{flagsQuery.error}</p> : null}
        {!flagsQuery.isLoading && !flagsQuery.error && flagsQuery.data.length === 0 ? (
          <p className="note">No feature flags for this tenant.</p>
        ) : null}
        {flagsQuery.data.length > 0 ? (
          <div className="list-tight">
            {flagsQuery.data.map((flag) => (
              <label key={flag.id}>
                <input type="checkbox" checked={flag.enabled} readOnly /> {flag.key}
              </label>
            ))}
          </div>
        ) : null}
      </section>
    </PlatformAdminShell>
  );
}
