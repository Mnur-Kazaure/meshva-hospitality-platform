import { ManagerShell } from '../dashboard-shell/ui/manager-shell';

export default function RoomOversightPage() {
  return (
    <ManagerShell title="Room & Status Oversight">
      <div className="card">
        <h3>Anomaly Board</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Room</th>
              <th>Status</th>
              <th>Anomaly</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>104</td>
              <td>DIRTY</td>
              <td>Dirty room aging beyond threshold</td>
            </tr>
            <tr>
              <td>202</td>
              <td>OCCUPIED</td>
              <td>No open stay linked</td>
            </tr>
          </tbody>
        </table>
      </div>
    </ManagerShell>
  );
}
