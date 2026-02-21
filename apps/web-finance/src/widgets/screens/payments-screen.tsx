'use client';

import { FormEvent, useState } from 'react';
import { PaymentMethod, type RecordPaymentDto } from '../../shared/types/contracts';
import { formatCurrency, formatDateTime } from '../../shared/lib/utils/format';
import { useStaffSession } from '../../processes/auth/model/staff-session-context';
import { usePaymentsQuery } from '../../entities/payment/model/use-payments-query';
import { useRecordPaymentMutation } from '../../features/record-payment/model/use-record-payment';
import { FinanceShell } from '../dashboard-shell/ui/finance-shell';

const PAYMENT_METHODS: PaymentMethod[] = [
  PaymentMethod.CASH,
  PaymentMethod.BANK_TRANSFER,
  PaymentMethod.POS,
];

export default function PaymentsPage() {
  const { selectedPropertyId } = useStaffSession();
  const paymentsQuery = usePaymentsQuery(selectedPropertyId);
  const paymentMutation = useRecordPaymentMutation();

  const [invoiceId, setInvoiceId] = useState('');
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [success, setSuccess] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccess(null);

    if (!selectedPropertyId) {
      return;
    }

    const numericAmount = Number(amount);
    if (!invoiceId.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      return;
    }

    const dto: RecordPaymentDto = {
      invoiceId: invoiceId.trim(),
      method,
      amount: numericAmount,
      reference: reference.trim() || undefined,
      note: note.trim() || undefined,
    };

    const result = await paymentMutation.mutate({
      propertyId: selectedPropertyId,
      dto,
    });

    if (!result) {
      return;
    }

    setSuccess(
      `Payment recorded. Outstanding moved from ${formatCurrency(result.outstandingBefore)} to ${formatCurrency(result.outstandingAfter)}.`,
    );
    setAmount('');
    setReference('');
    setNote('');
    await paymentsQuery.refetch();
  };

  return (
    <FinanceShell title="Payments">
      <div className="grid cols-2">
        <section className="card">
          <h3>Record Payment</h3>
          {!selectedPropertyId ? <p className="auth-error">Select a property to record payment.</p> : null}
          {success ? <div className="alert">{success}</div> : null}
          {paymentMutation.error ? <p className="auth-error">{paymentMutation.error}</p> : null}

          <form className="grid" onSubmit={onSubmit}>
            <label>
              Invoice ID
              <input
                className="input"
                placeholder="Invoice UUID"
                value={invoiceId}
                onChange={(event) => setInvoiceId(event.target.value)}
                required
              />
            </label>
            <label>
              Method
              <select className="select" value={method} onChange={(event) => setMethod(event.target.value as PaymentMethod)}>
                {PAYMENT_METHODS.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Amount
              <input
                className="input"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required
              />
            </label>
            <label>
              Reference
              <input
                className="input"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                placeholder="Optional transfer/POS reference"
              />
            </label>
            <label>
              Note
              <textarea
                className="textarea"
                value={note}
                maxLength={200}
                onChange={(event) => setNote(event.target.value)}
              />
            </label>
            <div className="toolbar">
              <button className="btn secondary" type="button" onClick={() => void paymentsQuery.refetch()}>
                Reload History
              </button>
              <button className="btn primary" type="submit" disabled={paymentMutation.isPending || !selectedPropertyId}>
                {paymentMutation.isPending ? 'Recording...' : 'Record Payment'}
              </button>
            </div>
          </form>
        </section>

        <section className="card">
          <h3>Payment History</h3>
          {paymentsQuery.isLoading ? <p className="note">Loading payment history...</p> : null}
          {paymentsQuery.error ? <p className="auth-error">{paymentsQuery.error}</p> : null}

          {!paymentsQuery.isLoading && !paymentsQuery.error && paymentsQuery.data.length === 0 ? (
            <p className="note">No payments recorded for this property yet.</p>
          ) : null}

          {paymentsQuery.data.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Invoice</th>
                  <th>Method</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {paymentsQuery.data.map((payment) => (
                  <tr key={payment.id}>
                    <td>{formatDateTime(payment.createdAt)}</td>
                    <td>{payment.invoiceId}</td>
                    <td>{payment.method}</td>
                    <td>{payment.paymentType}</td>
                    <td>{formatCurrency(payment.amount)}</td>
                    <td>{payment.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </section>
      </div>
    </FinanceShell>
  );
}
