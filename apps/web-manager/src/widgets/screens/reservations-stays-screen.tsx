import { ManagerShell } from '../dashboard-shell/ui/manager-shell';

export default function ReservationsStaysPage() {
  return (
    <ManagerShell title="Reservations & Stays">
      <div className="card">
        <h3>Intervention Queue</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Reservation</th>
              <th>Status</th>
              <th>Action Needed</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>RSV-2222-2001</td>
              <td>PENDING_CONFIRM</td>
              <td>Confirm or cancel</td>
            </tr>
            <tr>
              <td>RSV-2222-2002</td>
              <td>CONFIRMED</td>
              <td>No-show/override monitoring</td>
            </tr>
          </tbody>
        </table>
      </div>
    </ManagerShell>
  );
}
