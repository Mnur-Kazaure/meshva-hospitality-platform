import { FinanceShell } from '../dashboard-shell/ui/finance-shell';

export default function FinanceOverviewPage() {
  return (
    <FinanceShell title="Today Dashboard">
      <div className="grid cols-3">
        <section className="card">
          <div>Cash Revenue</div>
          <div className="kpi">NGN 0</div>
        </section>
        <section className="card">
          <div>Transfer Revenue</div>
          <div className="kpi">NGN 0</div>
        </section>
        <section className="card">
          <div>POS Revenue</div>
          <div className="kpi">NGN 0</div>
        </section>
        <section className="card">
          <div>Outstanding Balances</div>
          <div className="kpi">NGN 0</div>
        </section>
        <section className="card">
          <div>Pending Refund Execution</div>
          <div className="kpi">0</div>
        </section>
        <section className="card">
          <div>Daily Close Status</div>
          <div className="kpi">OPEN</div>
        </section>
      </div>
      <p className="note">Wire to `GET /v1/properties/:propertyId/finance/overview`.</p>
    </FinanceShell>
  );
}
