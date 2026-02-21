import { FinanceShell } from '../dashboard-shell/ui/finance-shell';

export default function ShiftHandoverPage() {
  return (
    <FinanceShell title="Shift Handover">
      <section className="card">
        <p className="note">Daily close must be complete before submitting handover.</p>
        <p className="note">Route: `POST /v1/properties/:propertyId/finance-handover`</p>
      </section>
    </FinanceShell>
  );
}
