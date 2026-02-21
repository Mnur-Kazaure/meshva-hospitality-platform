import { FrontDeskShell } from '../dashboard-shell/ui/front-desk-shell';

export default function ShiftHandoverPage() {
  return (
    <FrontDeskShell title="Shift Handover (Mandatory)">
      <section className="card">
        <div className="form-grid">
          <label>
            Shift
            <select className="select">
              <option>DAY</option>
              <option>NIGHT</option>
            </select>
          </label>
          <label>
            Exceptions (comma separated)
            <input className="input" placeholder="Pending arrivals, room issue, override request" />
          </label>
        </div>
        <label>
          Handover Notes
          <textarea className="textarea" placeholder="Mandatory before logout" />
        </label>
        <button className="btn primary">Submit Handover</button>
      </section>
      <p className="note">Wire to `POST /v1/properties/:propertyId/handover`.</p>
    </FrontDeskShell>
  );
}
