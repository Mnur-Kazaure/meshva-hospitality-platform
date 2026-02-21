'use client';

import { FormEvent, useState } from 'react';
import {
  OwnerExportFormat,
  OwnerExportType,
  type CreateOwnerExportJobDto,
} from '../../shared/types/contracts';
import { formatDateTime } from '../../shared/lib/utils/format';
import { useStaffSession } from '../../processes/auth/model/staff-session-context';
import { useOwnerExportCreateMutation } from '../../features/owner-export-create/model/use-owner-export-create';
import { useOwnerExportJobQuery } from '../../entities/owner-exports/model/use-owner-export-job-query';
import { OwnerShell } from '../dashboard-shell/ui/owner-shell';

const exportTypes: OwnerExportType[] = [
  OwnerExportType.REVENUE_SUMMARY,
  OwnerExportType.DAILY_CLOSE_COMPLIANCE,
  OwnerExportType.EXCEPTIONS_LOG,
  OwnerExportType.PAYMENTS_LEDGER,
  OwnerExportType.OUTSTANDING_INVOICES,
];

export default function ExportsPage() {
  const { selectedPropertyId } = useStaffSession();
  const createMutation = useOwnerExportCreateMutation();

  const today = new Date().toISOString().slice(0, 10);
  const [exportType, setExportType] = useState<OwnerExportType>(OwnerExportType.DAILY_CLOSE_COMPLIANCE);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [latestExportId, setLatestExportId] = useState<string | undefined>();
  const exportJobQuery = useOwnerExportJobQuery(latestExportId);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const dto: CreateOwnerExportJobDto = {
      exportType,
      format: OwnerExportFormat.CSV,
      from,
      to,
      propertyIds: selectedPropertyId,
    };

    const created = await createMutation.mutate(dto);
    if (!created) {
      return;
    }

    setLatestExportId(created.id);
  };

  return (
    <OwnerShell title="Exports">
      <section className="card">
        {createMutation.error ? <p className="auth-error">{createMutation.error}</p> : null}
        <form className="form-grid" onSubmit={onSubmit}>
          <label>
            Export Type
            <select className="select" value={exportType} onChange={(event) => setExportType(event.target.value as OwnerExportType)}>
              {exportTypes.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </select>
          </label>
          <label>
            Format
            <select className="select" value={OwnerExportFormat.CSV} disabled>
              <option>{OwnerExportFormat.CSV}</option>
            </select>
          </label>
          <label>
            From
            <input className="input" type="date" value={from} onChange={(event) => setFrom(event.target.value)} required />
          </label>
          <label>
            To
            <input className="input" type="date" value={to} onChange={(event) => setTo(event.target.value)} required />
          </label>
          <div className="toolbar" style={{ gridColumn: '1 / -1' }}>
            <button className="btn primary" type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Requesting...' : 'Request Export'}
            </button>
          </div>
        </form>
      </section>

      {latestExportId ? (
        <section className="card" style={{ marginTop: 12 }}>
          <h3>Latest Export Job</h3>
          {exportJobQuery.isLoading ? <p className="note">Loading export job...</p> : null}
          {exportJobQuery.error ? <p className="auth-error">{exportJobQuery.error}</p> : null}
          {!exportJobQuery.isLoading && !exportJobQuery.error ? (
            <div className="list-tight">
              <div><strong>ID:</strong> {exportJobQuery.data.id}</div>
              <div><strong>Status:</strong> {exportJobQuery.data.status}</div>
              <div><strong>Created:</strong> {formatDateTime(exportJobQuery.data.createdAt)}</div>
              <div><strong>Updated:</strong> {formatDateTime(exportJobQuery.data.updatedAt)}</div>
              <div><strong>Download:</strong> {exportJobQuery.data.downloadUrl ?? 'Pending'}</div>
            </div>
          ) : null}
          <div className="toolbar">
            <button className="btn secondary" onClick={() => void exportJobQuery.refetch()}>
              Refresh Job Status
            </button>
          </div>
        </section>
      ) : null}
    </OwnerShell>
  );
}
