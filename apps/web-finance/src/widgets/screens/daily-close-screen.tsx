import { FinanceShell } from '../dashboard-shell/ui/finance-shell';

export default function DailyClosePage() {
  return (
    <FinanceShell title="Daily Close">
      <div className="grid cols-2">
        <section className="card">
          <h3>Close Status</h3>
          <p className="note">Route: `GET /v1/properties/:propertyId/daily-close`</p>
        </section>
        <section className="card">
          <h3>Perform Daily Close</h3>
          <p className="note">Route: `POST /v1/properties/:propertyId/daily-close`</p>
        </section>
      </div>
      <div className="alert">Daily close locks same-day financial edits until manager unlock.</div>
    </FinanceShell>
  );
}
