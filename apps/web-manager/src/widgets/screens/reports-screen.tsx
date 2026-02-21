import { ManagerShell } from '../dashboard-shell/ui/manager-shell';

export default function ReportsPage() {
  return (
    <ManagerShell title="Reports (Lite)">
      <div className="grid cols-2">
        <div className="card">
          <h3>Occupancy Summary</h3>
          <p className="kpi">71%</p>
        </div>
        <div className="card">
          <h3>Revenue Snapshot (View-only)</h3>
          <p className="kpi">NGN 2.4M</p>
          <p className="note">Finance owns daily close and reconciliation.</p>
        </div>
      </div>
    </ManagerShell>
  );
}
