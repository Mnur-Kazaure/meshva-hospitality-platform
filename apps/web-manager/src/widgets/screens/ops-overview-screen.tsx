import { ManagerShell } from '../dashboard-shell/ui/manager-shell';

export default function OpsOverviewPage() {
  return (
    <ManagerShell title="Ops Overview">
      <div className="grid cols-3">
        <div className="card">
          <div>Occupancy</div>
          <div className="kpi">71%</div>
        </div>
        <div className="card">
          <div>Pending Approvals</div>
          <div className="kpi">5</div>
        </div>
        <div className="card">
          <div>Exceptions</div>
          <div className="kpi">3</div>
        </div>
      </div>
      <div className="grid cols-2" style={{ marginTop: 12 }}>
        <div className="card">
          <h3>Today Snapshot</h3>
          <table className="table">
            <tbody>
              <tr>
                <td>Arrivals</td>
                <td>11</td>
              </tr>
              <tr>
                <td>Departures</td>
                <td>9</td>
              </tr>
              <tr>
                <td>In-house guests</td>
                <td>34</td>
              </tr>
              <tr>
                <td>Dirty rooms</td>
                <td>4</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="card">
          <h3>Exceptions Feed</h3>
          <div className="alert">Override request waiting approval: EXTEND_CONFLICT (RoomType Deluxe)</div>
          <p className="note">Manager actions here are approval-gated and audit logged.</p>
        </div>
      </div>
    </ManagerShell>
  );
}
