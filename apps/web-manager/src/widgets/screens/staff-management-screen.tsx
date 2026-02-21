'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { CreateStaffDto } from '../../shared/types/contracts';
import { useStaffSession } from '../../processes/auth/model/staff-session-context';
import { useStaffListQuery } from '../../entities/staff/model/use-staff-list-query';
import { useStaffCreateMutation } from '../../features/staff-create/model/use-staff-create';
import {
  useStaffActivateMutation,
  useStaffDeactivateMutation,
  useStaffSoftDeleteMutation,
} from '../../features/staff-status/model/use-staff-status';
import { useStaffResetInviteMutation } from '../../features/staff-reset-invite/model/use-staff-reset-invite';
import { ManagerShell } from '../dashboard-shell/ui/manager-shell';

function parseCsvIds(value: string): string[] {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

export default function StaffManagementPage() {
  const { selectedPropertyId } = useStaffSession();

  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [roleIdsCsv, setRoleIdsCsv] = useState('');
  const [propertyAccessCsv, setPropertyAccessCsv] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const query = useMemo(
    () => ({
      status: statusFilter || undefined,
      q: search.trim() || undefined,
    }),
    [search, statusFilter],
  );

  const listQuery = useStaffListQuery(selectedPropertyId, query);
  const createMutation = useStaffCreateMutation();
  const activateMutation = useStaffActivateMutation();
  const deactivateMutation = useStaffDeactivateMutation();
  const softDeleteMutation = useStaffSoftDeleteMutation();
  const resetInviteMutation = useStaffResetInviteMutation();

  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);

  useEffect(() => {
    if (selectedPropertyId && propertyAccessCsv.trim().length === 0) {
      setPropertyAccessCsv(selectedPropertyId);
    }
  }, [propertyAccessCsv, selectedPropertyId]);

  const onCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setLastInviteLink(null);

    if (!selectedPropertyId) {
      return;
    }

    const roleIds = parseCsvIds(roleIdsCsv);
    const propertyAccessIds = parseCsvIds(propertyAccessCsv);
    if (!propertyAccessIds.includes(selectedPropertyId)) {
      propertyAccessIds.push(selectedPropertyId);
    }

    const dto: CreateStaffDto = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      roleIds,
      propertyAccessIds,
    };

    const result = await createMutation.mutate({
      propertyId: selectedPropertyId,
      dto,
    });

    if (!result) {
      return;
    }

    setMessage('Staff account created successfully.');
    setLastInviteLink(result.invite.inviteLink);
    setFullName('');
    setPhone('');
    setEmail('');
    setRoleIdsCsv('');
    setPropertyAccessCsv(selectedPropertyId);
    await listQuery.refetch();
  };

  const executeDeactivate = async (userId: string) => {
    if (!selectedPropertyId) {
      return;
    }

    const reason = window.prompt('Reason for deactivation (min 5 characters):', 'Policy enforcement');
    if (!reason || reason.trim().length < 5) {
      return;
    }

    const result = await deactivateMutation.mutate({
      propertyId: selectedPropertyId,
      userId,
      dto: { reason: reason.trim() },
    });

    if (!result) {
      return;
    }

    setMessage(`Staff ${result.id} deactivated.`);
    await listQuery.refetch();
  };

  const executeActivate = async (userId: string) => {
    if (!selectedPropertyId) {
      return;
    }

    const result = await activateMutation.mutate({
      propertyId: selectedPropertyId,
      userId,
    });

    if (!result) {
      return;
    }

    setMessage(`Staff ${result.id} activated.`);
    await listQuery.refetch();
  };

  const executeResetInvite = async (userId: string) => {
    if (!selectedPropertyId) {
      return;
    }

    const result = await resetInviteMutation.mutate({
      propertyId: selectedPropertyId,
      userId,
      dto: {
        reason: 'Re-issued invite from manager console',
        inviteExpiryHours: 72,
      },
    });

    if (!result) {
      return;
    }

    setMessage(`Invite reset for ${result.id}.`);
    setLastInviteLink(result.invite.inviteLink);
    await listQuery.refetch();
  };

  const executeSoftDelete = async (userId: string) => {
    if (!selectedPropertyId) {
      return;
    }

    const reason = window.prompt('Reason for soft-delete (min 5 characters):', 'Staff exited organization');
    if (!reason || reason.trim().length < 5) {
      return;
    }

    const result = await softDeleteMutation.mutate({
      propertyId: selectedPropertyId,
      userId,
      dto: { reason: reason.trim() },
    });

    if (!result) {
      return;
    }

    setMessage(`Staff ${result.id} soft-deleted.`);
    await listQuery.refetch();
  };

  const isBusy =
    createMutation.isPending ||
    activateMutation.isPending ||
    deactivateMutation.isPending ||
    softDeleteMutation.isPending ||
    resetInviteMutation.isPending;

  return (
    <ManagerShell title="Staff Management">
      {!selectedPropertyId ? <p className="auth-error">Select a property first.</p> : null}

      {message ? <div className="alert">{message}</div> : null}
      {lastInviteLink ? (
        <section className="card">
          <h3 style={{ marginTop: 0 }}>Latest Invite Link</h3>
          <p className="note" style={{ wordBreak: 'break-all' }}>
            {lastInviteLink}
          </p>
        </section>
      ) : null}

      <section className="card" style={{ marginTop: 12 }}>
        <h3>Create Staff</h3>
        <p className="note">Provide role IDs and property IDs as comma-separated UUIDs.</p>
        {createMutation.error ? <p className="auth-error">{createMutation.error}</p> : null}

        <form className="grid" onSubmit={onCreate}>
          <div className="form-grid cols-3">
            <label>
              Full Name
              <input className="input" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
            </label>
            <label>
              Phone
              <input className="input" value={phone} onChange={(event) => setPhone(event.target.value)} required />
            </label>
            <label>
              Email
              <input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
          </div>
          <div className="form-grid cols-2">
            <label>
              Role IDs (comma-separated)
              <input
                className="input"
                value={roleIdsCsv}
                onChange={(event) => setRoleIdsCsv(event.target.value)}
                placeholder="uuid-1,uuid-2"
                required
              />
            </label>
            <label>
              Property Access IDs (comma-separated)
              <input
                className="input"
                value={propertyAccessCsv}
                onChange={(event) => setPropertyAccessCsv(event.target.value)}
                placeholder={selectedPropertyId ?? 'property-uuid'}
              />
            </label>
          </div>
          <div className="toolbar">
            <button className="btn secondary" type="button" onClick={() => void listQuery.refetch()}>
              Refresh List
            </button>
            <button className="btn primary" type="submit" disabled={isBusy || !selectedPropertyId}>
              {createMutation.isPending ? 'Creating...' : 'Create Staff'}
            </button>
          </div>
        </form>
      </section>

      <section className="card" style={{ marginTop: 12 }}>
        <div className="header" style={{ marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Staff Directory</h3>
          <div className="form-grid cols-2" style={{ minWidth: 420 }}>
            <label>
              Status
              <select
                className="select"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="deactivated">Deactivated</option>
                <option value="soft_deleted">Soft Deleted</option>
              </select>
            </label>
            <label>
              Search
              <input
                className="input"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name, email, phone"
              />
            </label>
          </div>
        </div>

        {listQuery.isLoading ? <p className="note">Loading staff...</p> : null}
        {listQuery.error ? <p className="auth-error">{listQuery.error}</p> : null}
        {!listQuery.isLoading && !listQuery.error && listQuery.data.rows.length === 0 ? (
          <p className="note">No staff found for this filter.</p>
        ) : null}

        {listQuery.data.rows.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Roles</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {listQuery.data.rows.map((staff) => (
                <tr key={staff.id}>
                  <td>{staff.fullName}</td>
                  <td>
                    <div>{staff.email ?? '--'}</div>
                    <div className="note">{staff.phone ?? '--'}</div>
                  </td>
                  <td>{staff.status}</td>
                  <td>{staff.roles.join(', ') || '--'}</td>
                  <td>
                    <div className="toolbar" style={{ marginTop: 0 }}>
                      {staff.status === 'active' ? (
                        <button className="btn secondary" type="button" onClick={() => void executeDeactivate(staff.id)} disabled={isBusy}>
                          Deactivate
                        </button>
                      ) : (
                        <button className="btn secondary" type="button" onClick={() => void executeActivate(staff.id)} disabled={isBusy}>
                          Activate
                        </button>
                      )}
                      <button className="btn primary" type="button" onClick={() => void executeResetInvite(staff.id)} disabled={isBusy}>
                        Reset Invite
                      </button>
                      <button className="btn danger" type="button" onClick={() => void executeSoftDelete(staff.id)} disabled={isBusy}>
                        Soft Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>
    </ManagerShell>
  );
}
