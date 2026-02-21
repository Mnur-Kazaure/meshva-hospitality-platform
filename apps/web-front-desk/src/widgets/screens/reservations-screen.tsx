import { FrontDeskShell } from '../dashboard-shell/ui/front-desk-shell';

export default function ReservationsPage() {
  return (
    <FrontDeskShell title="Reservations">
      <div className="toolbar">
        <input className="input" placeholder="Search by name, phone, reservation code" />
        <button className="btn primary">New Booking</button>
      </div>
      <section className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Guest</th>
              <th>Room Type</th>
              <th>Dates</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5}>No reservations loaded yet</td>
            </tr>
          </tbody>
        </table>
      </section>
      <p className="note">Wire to `GET/POST/PATCH /v1/properties/:propertyId/reservations`.</p>
    </FrontDeskShell>
  );
}
