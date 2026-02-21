'use client';

import { useMemo, useState } from 'react';
import {
  PaymentMethod,
  type ExecuteRefundDto,
  type RefundListItemDto,
} from '../../shared/types/contracts';
import { formatCurrency, formatDateTime } from '../../shared/lib/utils/format';
import { useStaffSession } from '../../processes/auth/model/staff-session-context';
import { useRefundsQuery } from '../../entities/refund/model/use-refunds-query';
import { useExecuteRefundMutation } from '../../features/execute-refund/model/use-execute-refund';
import { CriticalActionDialog } from '../../shared/ui/critical-action-dialog';
import { FinanceShell } from '../dashboard-shell/ui/finance-shell';

const PAYMENT_METHODS: PaymentMethod[] = [
  PaymentMethod.CASH,
  PaymentMethod.BANK_TRANSFER,
  PaymentMethod.POS,
];

export default function RefundsPage() {
  const { selectedPropertyId } = useStaffSession();
  const refundsQuery = useRefundsQuery(selectedPropertyId);
  const executeMutation = useExecuteRefundMutation();

  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<RefundListItemDto | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const executeCandidates = useMemo(
    () => refundsQuery.data.filter((refund) => !refund.execution),
    [refundsQuery.data],
  );

  const openExecutionDialog = (refund: RefundListItemDto) => {
    setSuccess(null);
    setSelectedRefund(refund);
    setDialogOpen(true);
  };

  const onConfirmExecution = async (reason: string) => {
    if (!selectedPropertyId || !selectedRefund) {
      return;
    }

    const dto: ExecuteRefundDto = {
      method,
      reference: reference.trim() || undefined,
      note: [note.trim(), `Reason: ${reason}`].filter(Boolean).join(' | '),
    };

    const result = await executeMutation.mutate({
      propertyId: selectedPropertyId,
      refundId: selectedRefund.id,
      dto,
    });

    if (!result) {
      return;
    }

    setDialogOpen(false);
    setSuccess(
      result.alreadyExecuted
        ? `Refund ${selectedRefund.id} was already executed earlier.`
        : `Refund executed for ${formatCurrency(selectedRefund.amount)}.`,
    );
    await refundsQuery.refetch();
  };

  return (
    <FinanceShell title="Refunds">
      <section className="card">
        <div className="alert">Only manager-approved refunds can be executed by Finance.</div>
        {!selectedPropertyId ? <p className="auth-error">Select a property to execute refunds.</p> : null}
        {success ? <div className="alert">{success}</div> : null}
        {executeMutation.error ? <p className="auth-error">{executeMutation.error}</p> : null}

        <div className="form-grid cols-3" style={{ marginTop: 12 }}>
          <label>
            Execution Method
            <select className="select" value={method} onChange={(event) => setMethod(event.target.value as PaymentMethod)}>
              {PAYMENT_METHODS.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </select>
          </label>
          <label>
            Reference
            <input
              className="input"
              placeholder="Optional reference"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
            />
          </label>
          <label>
            Note
            <input
              className="input"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Optional execution note"
            />
          </label>
        </div>

        <div className="toolbar">
          <button className="btn secondary" type="button" onClick={() => void refundsQuery.refetch()}>
            Reload Approved Refunds
          </button>
        </div>

        {refundsQuery.isLoading ? <p className="note">Loading approved refunds...</p> : null}
        {refundsQuery.error ? <p className="auth-error">{refundsQuery.error}</p> : null}

        {!refundsQuery.isLoading && !refundsQuery.error && refundsQuery.data.length === 0 ? (
          <p className="note">No approved refunds waiting for execution.</p>
        ) : null}

        {refundsQuery.data.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Refund ID</th>
                <th>Invoice</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Requested</th>
                <th>Execution</th>
              </tr>
            </thead>
            <tbody>
              {refundsQuery.data.map((refund) => (
                <tr key={refund.id}>
                  <td>{refund.id}</td>
                  <td>{refund.invoiceId}</td>
                  <td>{formatCurrency(refund.amount)}</td>
                  <td>{refund.status}</td>
                  <td>{formatDateTime(refund.createdAt)}</td>
                  <td>
                    {refund.execution ? (
                      <span className="badge">Executed</span>
                    ) : (
                      <button
                        className="btn primary"
                        type="button"
                        onClick={() => openExecutionDialog(refund)}
                        disabled={executeMutation.isPending || !selectedPropertyId}
                      >
                        Execute
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}

        {executeCandidates.length > 0 ? (
          <p className="note">{executeCandidates.length} approved refund(s) pending execution.</p>
        ) : null}
      </section>

      <CriticalActionDialog
        open={dialogOpen}
        title="Confirm refund execution"
        description="This financial action is audited and cannot be silently reversed."
        onCancel={() => setDialogOpen(false)}
        onConfirm={onConfirmExecution}
      />
    </FinanceShell>
  );
}
