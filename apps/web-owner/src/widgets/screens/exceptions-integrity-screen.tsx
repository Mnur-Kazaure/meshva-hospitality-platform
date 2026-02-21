'use client';

import { useMemo, useState } from 'react';
import { ExceptionSeverity, OwnerExceptionType } from '../../shared/types/contracts';
import { useStaffSession } from '../../processes/auth/model/staff-session-context';
import { useOwnerExceptionsQuery } from '../../entities/owner-exceptions/model/use-owner-exceptions-query';
import {
  useAcknowledgeOwnerExceptionMutation,
  useOwnerExceptionNoteMutation,
} from '../../features/owner-exception-actions/model/use-owner-exception-actions';
import { CriticalActionDialog } from '../../shared/ui/critical-action-dialog';
import { OwnerShell } from '../dashboard-shell/ui/owner-shell';

const exceptionTypes = ['ALL', ...Object.values(OwnerExceptionType)] as const;
const severityTypes = ['ALL', ...Object.values(ExceptionSeverity)] as const;

export default function ExceptionsIntegrityPage() {
  const { selectedPropertyId } = useStaffSession();
  const [type, setType] = useState<(typeof exceptionTypes)[number]>('ALL');
  const [severity, setSeverity] = useState<(typeof severityTypes)[number]>('ALL');
  const [noteExceptionId, setNoteExceptionId] = useState<string | null>(null);

  const exceptionsQuery = useOwnerExceptionsQuery({
    propertyIds: selectedPropertyId,
    type: type === 'ALL' ? undefined : type,
    severity: severity === 'ALL' ? undefined : severity,
  });
  const ackMutation = useAcknowledgeOwnerExceptionMutation();
  const noteMutation = useOwnerExceptionNoteMutation();

  const hasPendingMutation = ackMutation.isPending || noteMutation.isPending;

  const onAcknowledge = async (exceptionId: string) => {
    const result = await ackMutation.mutate(exceptionId);
    if (!result) {
      return;
    }

    await exceptionsQuery.refetch();
  };

  const onCreateNote = async (text: string) => {
    if (!noteExceptionId) {
      return;
    }

    const result = await noteMutation.mutate({
      exceptionId: noteExceptionId,
      dto: { text },
    });
    if (!result) {
      return;
    }

    setNoteExceptionId(null);
    await exceptionsQuery.refetch();
  };

  const mutationError = ackMutation.error ?? noteMutation.error;

  return (
    <OwnerShell title="Exceptions & Integrity">
      <div className="toolbar">
        <select className="select" value={type} onChange={(event) => setType(event.target.value as (typeof exceptionTypes)[number])}>
          {exceptionTypes.map((entry) => (
            <option key={entry} value={entry}>
              {entry}
            </option>
          ))}
        </select>
        <select
          className="select"
          value={severity}
          onChange={(event) => setSeverity(event.target.value as (typeof severityTypes)[number])}
        >
          {severityTypes.map((entry) => (
            <option key={entry} value={entry}>
              {entry}
            </option>
          ))}
        </select>
      </div>

      <section className="card">
        {exceptionsQuery.isLoading ? <p className="note">Loading exceptions...</p> : null}
        {exceptionsQuery.error ? <p className="auth-error">{exceptionsQuery.error}</p> : null}
        {mutationError ? <p className="auth-error">{mutationError}</p> : null}

        {!exceptionsQuery.isLoading && !exceptionsQuery.error && exceptionsQuery.data.exceptions.length === 0 ? (
          <p className="note">No exceptions found for the selected filters.</p>
        ) : null}

        {exceptionsQuery.data.exceptions.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Severity</th>
                <th>Property</th>
                <th>Actor</th>
                <th>Type</th>
                <th>Summary</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {exceptionsQuery.data.exceptions.map((exception) => {
                const badgeClass = exception.severity === ExceptionSeverity.RED ? 'red' : 'amber';

                return (
                  <tr key={exception.id}>
                    <td><span className={`badge ${badgeClass}`}>{exception.severity}</span></td>
                    <td>{exception.propertyId ?? '-'}</td>
                    <td>{exception.actorUserId ?? '-'}</td>
                    <td>{exception.type}</td>
                    <td>{exception.summary}</td>
                    <td>
                      <div className="toolbar" style={{ marginBottom: 0 }}>
                        <button
                          className="btn secondary"
                          onClick={() => void onAcknowledge(exception.id)}
                          disabled={hasPendingMutation || Boolean(exception.acknowledgedAt)}
                        >
                          {exception.acknowledgedAt ? 'Acknowledged' : 'Acknowledge'}
                        </button>
                        <button
                          className="btn secondary"
                          onClick={() => setNoteExceptionId(exception.id)}
                          disabled={hasPendingMutation}
                        >
                          Add Note
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : null}
      </section>

      <CriticalActionDialog
        title="Add Owner Note"
        description="This note will be attached to the selected exception and auditable."
        open={Boolean(noteExceptionId)}
        onCancel={() => setNoteExceptionId(null)}
        onConfirm={onCreateNote}
      />
    </OwnerShell>
  );
}
