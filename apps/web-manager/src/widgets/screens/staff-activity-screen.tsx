import { ManagerShell } from '../dashboard-shell/ui/manager-shell';

export default function StaffActivityPage() {
  return (
    <ManagerShell title="Staff Activity">
      <div className="card">
        <h3>Audit Timeline</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Time</th>
              <th>User</th>
              <th>Action</th>
              <th>Entity</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>09:21</td>
              <td>Front Desk Agent</td>
              <td>DISCOUNT_REQUESTED</td>
              <td>Reservation RSV-2222-2002</td>
            </tr>
            <tr>
              <td>09:40</td>
              <td>Hotel Manager</td>
              <td>OVERRIDE_APPROVED</td>
              <td>Override Request #6500...</td>
            </tr>
          </tbody>
        </table>
      </div>
    </ManagerShell>
  );
}
