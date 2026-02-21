import { FrontDeskShell } from '../dashboard-shell/ui/front-desk-shell';

export default function CheckInCheckoutPage() {
  return (
    <FrontDeskShell title="Check-in / Check-out">
      <div className="grid cols-2">
        <section className="card">
          <h3>Check-in</h3>
          <label>
            Reservation ID
            <input className="input" />
          </label>
          <label>
            Assign Room ID
            <input className="input" />
          </label>
          <button className="btn primary">Run Check-in</button>
          <p className="note">POST `/v1/properties/:propertyId/stays/checkin`</p>
        </section>
        <section className="card">
          <h3>Check-out</h3>
          <label>
            Stay ID
            <input className="input" />
          </label>
          <label>
            Notes
            <textarea className="textarea" />
          </label>
          <button className="btn primary">Run Check-out</button>
          <p className="note">POST `/v1/properties/:propertyId/stays/:stayId/checkout`</p>
        </section>
      </div>
    </FrontDeskShell>
  );
}
