'use client';

import { FormEvent, useState } from 'react';
import { SubscriptionPlanCode, type CreateSubscriptionPlanDto } from '../../shared/types/contracts';
import { usePlatformSubscriptionsQuery } from '../../entities/platform-subscriptions/model/use-platform-subscriptions-query';
import {
  useCreatePlatformSubscriptionMutation,
  useUpdatePlatformSubscriptionMutation,
} from '../../features/platform-subscription-actions/model/use-platform-subscription-actions';
import { PlatformAdminShell } from '../dashboard-shell/ui/platform-admin-shell';

const planCodes: SubscriptionPlanCode[] = [
  SubscriptionPlanCode.STARTER,
  SubscriptionPlanCode.STANDARD,
  SubscriptionPlanCode.PRO,
  SubscriptionPlanCode.CUSTOM,
];

export default function SubscriptionsPlansPage() {
  const plansQuery = usePlatformSubscriptionsQuery();
  const createMutation = useCreatePlatformSubscriptionMutation();
  const updateMutation = useUpdatePlatformSubscriptionMutation();

  const [code, setCode] = useState<SubscriptionPlanCode>(SubscriptionPlanCode.STANDARD);
  const [name, setName] = useState('');
  const [propertyLimit, setPropertyLimit] = useState('1');
  const [userLimit, setUserLimit] = useState('10');

  const onCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const dto: CreateSubscriptionPlanDto = {
      code,
      name: name.trim(),
      propertyLimit: Number(propertyLimit),
      userLimit: Number(userLimit),
      features: {},
      isActive: true,
    };

    const created = await createMutation.mutate(dto);
    if (!created) {
      return;
    }

    setName('');
    await plansQuery.refetch();
  };

  const onToggleActive = async (planId: string, nextActive: boolean) => {
    const updated = await updateMutation.mutate({
      planId,
      dto: { isActive: nextActive },
    });
    if (!updated) {
      return;
    }

    await plansQuery.refetch();
  };

  const mutationError = createMutation.error ?? updateMutation.error;

  return (
    <PlatformAdminShell title="Subscriptions & Plans">
      <section className="card">
        <h3>Create Plan</h3>
        {mutationError ? <p className="auth-error">{mutationError}</p> : null}
        <form className="form-grid" onSubmit={onCreate}>
          <label>
            Code
            <select className="select" value={code} onChange={(event) => setCode(event.target.value as SubscriptionPlanCode)}>
              {planCodes.map((entry) => (
                <option key={entry} value={entry}>{entry}</option>
              ))}
            </select>
          </label>
          <label>
            Name
            <input className="input" value={name} onChange={(event) => setName(event.target.value)} required />
          </label>
          <label>
            Property Limit
            <input className="input" type="number" min="1" value={propertyLimit} onChange={(event) => setPropertyLimit(event.target.value)} required />
          </label>
          <label>
            User Limit
            <input className="input" type="number" min="1" value={userLimit} onChange={(event) => setUserLimit(event.target.value)} required />
          </label>
          <div className="toolbar" style={{ gridColumn: '1 / -1' }}>
            <button className="btn primary" type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Plan'}
            </button>
          </div>
        </form>
      </section>

      <section className="card" style={{ marginTop: 12 }}>
        {plansQuery.isLoading ? <p className="note">Loading plans...</p> : null}
        {plansQuery.error ? <p className="auth-error">{plansQuery.error}</p> : null}
        {!plansQuery.isLoading && !plansQuery.error && plansQuery.data.length === 0 ? (
          <p className="note">No subscription plans configured.</p>
        ) : null}
        {plansQuery.data.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Plan</th>
                <th>Property Limit</th>
                <th>User Limit</th>
                <th>Feature Flags</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {plansQuery.data.map((plan) => (
                <tr key={plan.id}>
                  <td>{plan.name}</td>
                  <td>{plan.propertyLimit}</td>
                  <td>{plan.userLimit}</td>
                  <td>{Object.keys(plan.featuresJson ?? {}).length}</td>
                  <td>
                    <button className="btn secondary" onClick={() => void onToggleActive(plan.id, !plan.isActive)} disabled={updateMutation.isPending}>
                      {plan.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>
    </PlatformAdminShell>
  );
}
