'use client';

import { FormEvent, useMemo, useState } from 'react';
import type { CreateTenantDto, SuspendTenantDto } from '../../shared/types/contracts';
import { usePlatformSubscriptionsQuery } from '../../entities/platform-subscriptions/model/use-platform-subscriptions-query';
import { usePlatformTenantDetailsQuery } from '../../entities/platform-tenants/model/use-platform-tenants-query';
import {
  useAssignPlatformPlanMutation,
  useCreatePlatformTenantMutation,
  useReactivatePlatformTenantMutation,
  useSuspendPlatformTenantMutation,
} from '../../features/platform-tenant-actions/model/use-platform-tenant-actions';
import { PlatformAdminShell } from '../dashboard-shell/ui/platform-admin-shell';

export default function TenantDetailsPage() {
  const plansQuery = usePlatformSubscriptionsQuery();
  const createMutation = useCreatePlatformTenantMutation();
  const suspendMutation = useSuspendPlatformTenantMutation();
  const reactivateMutation = useReactivatePlatformTenantMutation();
  const assignPlanMutation = useAssignPlatformPlanMutation();

  const today = new Date().toISOString().slice(0, 10);
  const initialPlanId = plansQuery.data[0]?.id ?? '';

  const [name, setName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [country, setCountry] = useState('NG');
  const [state, setState] = useState('Kano');
  const [timezone, setTimezone] = useState('Africa/Lagos');
  const [subscriptionPlanId, setSubscriptionPlanId] = useState(initialPlanId);
  const [initialPropertyName, setInitialPropertyName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [createdTenantId, setCreatedTenantId] = useState<string | undefined>();

  const [statusTenantId, setStatusTenantId] = useState('');
  const [suspendReason, setSuspendReason] = useState('Policy violation');
  const [assignPlanId, setAssignPlanId] = useState(initialPlanId);
  const [effectiveFrom, setEffectiveFrom] = useState(today);

  const detailsTenantId = createdTenantId || statusTenantId || undefined;
  const tenantDetailsQuery = usePlatformTenantDetailsQuery(detailsTenantId);

  const onCreateTenant = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const dto: CreateTenantDto = {
      name: name.trim(),
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim(),
      country: country.trim(),
      state: state.trim(),
      timezone: timezone.trim(),
      subscriptionPlanId: subscriptionPlanId || plansQuery.data[0]?.id || '',
      initialPropertyName: initialPropertyName.trim(),
      initialOwner: {
        fullName: ownerName.trim(),
        email: ownerEmail.trim(),
        phone: ownerPhone.trim(),
      },
    };

    const created = await createMutation.mutate(dto);
    if (!created) {
      return;
    }

    setCreatedTenantId(created.tenant.id);
    setStatusTenantId(created.tenant.id);
  };

  const onSuspend = async () => {
    if (!statusTenantId.trim()) {
      return;
    }

    const dto: SuspendTenantDto = { reason: suspendReason.trim() || 'Administrative hold' };
    const updated = await suspendMutation.mutate({ tenantId: statusTenantId.trim(), dto });
    if (!updated) {
      return;
    }

    await tenantDetailsQuery.refetch();
  };

  const onReactivate = async () => {
    if (!statusTenantId.trim()) {
      return;
    }

    const updated = await reactivateMutation.mutate(statusTenantId.trim());
    if (!updated) {
      return;
    }

    await tenantDetailsQuery.refetch();
  };

  const onAssignPlan = async () => {
    if (!statusTenantId.trim() || !assignPlanId) {
      return;
    }

    const assigned = await assignPlanMutation.mutate({
      tenantId: statusTenantId.trim(),
      dto: {
        subscriptionPlanId: assignPlanId,
        effectiveFrom,
      },
    });
    if (!assigned) {
      return;
    }

    await tenantDetailsQuery.refetch();
  };

  const mutationError =
    createMutation.error ??
    suspendMutation.error ??
    reactivateMutation.error ??
    assignPlanMutation.error;

  const planOptions = useMemo(() => plansQuery.data, [plansQuery.data]);

  return (
    <PlatformAdminShell title="Tenant Details">
      <div className="grid cols-2">
        <section className="card">
          <h3>Onboard Tenant</h3>
          {plansQuery.isLoading ? <p className="note">Loading plans...</p> : null}
          {mutationError ? <p className="auth-error">{mutationError}</p> : null}

          <form className="form-grid" onSubmit={onCreateTenant}>
            <label>
              Organization Name
              <input className="input" value={name} onChange={(event) => setName(event.target.value)} required />
            </label>
            <label>
              Plan
              <select className="select" value={subscriptionPlanId} onChange={(event) => setSubscriptionPlanId(event.target.value)} required>
                <option value="">Select plan</option>
                {planOptions.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Contact Email
              <input className="input" type="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} required />
            </label>
            <label>
              Contact Phone
              <input className="input" value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} required />
            </label>
            <label>
              Initial Property
              <input className="input" value={initialPropertyName} onChange={(event) => setInitialPropertyName(event.target.value)} required />
            </label>
            <label>
              Timezone
              <input className="input" value={timezone} onChange={(event) => setTimezone(event.target.value)} required />
            </label>
            <label>
              Country
              <input className="input" value={country} onChange={(event) => setCountry(event.target.value)} required />
            </label>
            <label>
              State
              <input className="input" value={state} onChange={(event) => setState(event.target.value)} required />
            </label>
            <label>
              Initial Owner Name
              <input className="input" value={ownerName} onChange={(event) => setOwnerName(event.target.value)} required />
            </label>
            <label>
              Initial Owner Email
              <input className="input" type="email" value={ownerEmail} onChange={(event) => setOwnerEmail(event.target.value)} required />
            </label>
            <label>
              Initial Owner Phone
              <input className="input" value={ownerPhone} onChange={(event) => setOwnerPhone(event.target.value)} required />
            </label>
            <div className="toolbar" style={{ gridColumn: '1 / -1' }}>
              <button className="btn primary" type="submit" disabled={createMutation.isPending || planOptions.length === 0}>
                {createMutation.isPending ? 'Creating...' : 'Create Tenant'}
              </button>
            </div>
          </form>
        </section>
        <section className="card">
          <h3>Status Controls</h3>
          <div className="form-grid">
            <label className="span-2">
              Tenant ID
              <input className="input" value={statusTenantId} onChange={(event) => setStatusTenantId(event.target.value)} />
            </label>
            <label className="span-2">
              Suspend Reason
              <input className="input" value={suspendReason} onChange={(event) => setSuspendReason(event.target.value)} />
            </label>
            <label>
              Assign Plan
              <select className="select" value={assignPlanId} onChange={(event) => setAssignPlanId(event.target.value)}>
                <option value="">Select plan</option>
                {planOptions.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Effective From
              <input className="input" type="date" value={effectiveFrom} onChange={(event) => setEffectiveFrom(event.target.value)} />
            </label>
          </div>
          <div className="toolbar">
            <button className="btn secondary" onClick={() => void onSuspend()} disabled={suspendMutation.isPending || !statusTenantId.trim()}>
              {suspendMutation.isPending ? 'Suspending...' : 'Suspend Tenant'}
            </button>
            <button className="btn secondary" onClick={() => void onReactivate()} disabled={reactivateMutation.isPending || !statusTenantId.trim()}>
              {reactivateMutation.isPending ? 'Reactivating...' : 'Reactivate Tenant'}
            </button>
            <button className="btn secondary" onClick={() => void onAssignPlan()} disabled={assignPlanMutation.isPending || !statusTenantId.trim() || !assignPlanId}>
              {assignPlanMutation.isPending ? 'Assigning...' : 'Assign Plan'}
            </button>
          </div>

          {detailsTenantId ? (
            <div style={{ marginTop: 12 }}>
              <h4>Tenant Snapshot</h4>
              {tenantDetailsQuery.isLoading ? <p className="note">Loading tenant details...</p> : null}
              {tenantDetailsQuery.error ? <p className="auth-error">{tenantDetailsQuery.error}</p> : null}
              {!tenantDetailsQuery.isLoading && !tenantDetailsQuery.error ? (
                <div className="list-tight">
                  <div><strong>Name:</strong> {tenantDetailsQuery.data.tenant.name}</div>
                  <div><strong>Status:</strong> {tenantDetailsQuery.data.tenant.status}</div>
                  <div><strong>Properties:</strong> {tenantDetailsQuery.data.properties.length}</div>
                  <div><strong>Users:</strong> {tenantDetailsQuery.data.users.length}</div>
                  <div><strong>Flags:</strong> {tenantDetailsQuery.data.featureFlags.length}</div>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>
    </PlatformAdminShell>
  );
}
