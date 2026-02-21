import { FinanceShell } from '../dashboard-shell/ui/finance-shell';

export default function ReportsPage() {
  return (
    <FinanceShell title="Reports">
      <section className="card">
        <p className="note">Daily close emits reporting jobs:</p>
        <ul>
          <li>`reporting.managerDailySummary.enqueue`</li>
          <li>`reporting.ownerDigest.enqueue`</li>
        </ul>
      </section>
    </FinanceShell>
  );
}
