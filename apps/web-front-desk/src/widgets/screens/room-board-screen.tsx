import { FrontDeskShell } from '../dashboard-shell/ui/front-desk-shell';

export default function RoomBoardPage() {
  return (
    <FrontDeskShell title="Room Board">
      <div className="toolbar">
        <button className="btn primary">Refresh Board</button>
      </div>
      <section className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Room</th>
              <th>Type</th>
              <th>Status</th>
              <th>Current Stay</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={4}>No data loaded yet</td>
            </tr>
          </tbody>
        </table>
      </section>
      <p className="note">Wire to `GET /v1/properties/:propertyId/rooms/board`.</p>
    </FrontDeskShell>
  );
}
