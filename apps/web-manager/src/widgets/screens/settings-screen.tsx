import { ManagerShell } from '../dashboard-shell/ui/manager-shell';

export default function SettingsPage() {
  return (
    <ManagerShell title="Settings (Property)">
      <div className="card">
        <h3>Policy Toggles</h3>
        <table className="table">
          <tbody>
            <tr>
              <td>Reservation default status</td>
              <td>CONFIRMED</td>
            </tr>
            <tr>
              <td>Require manager for discounts</td>
              <td>Enabled</td>
            </tr>
            <tr>
              <td>Require manager for day unlock</td>
              <td>Enabled</td>
            </tr>
          </tbody>
        </table>
      </div>
    </ManagerShell>
  );
}
