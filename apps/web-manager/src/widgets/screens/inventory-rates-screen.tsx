import { ManagerShell } from '../dashboard-shell/ui/manager-shell';

export default function InventoryRatesPage() {
  return (
    <ManagerShell title="Inventory & Rates">
      <div className="grid cols-2">
        <div className="card">
          <h3>Rate Plans</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Room Type</th>
                <th>Base Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Standard Rack</td>
                <td>Standard</td>
                <td>NGN 42,000</td>
              </tr>
              <tr>
                <td>Deluxe Rack</td>
                <td>Deluxe</td>
                <td>NGN 65,000</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="card">
          <h3>Inventory Controls</h3>
          <p className="note">Use calendar blocks for maintenance and day overrides for emergency allocations.</p>
          <div className="alert">All overrides are exception events visible to owner digest.</div>
        </div>
      </div>
    </ManagerShell>
  );
}
