import { FrontDeskShell } from '../dashboard-shell/ui/front-desk-shell';

export default function ConfirmationsPage() {
  return (
    <FrontDeskShell title="Confirmations">
      <section className="card">
        <div className="form-grid">
          <label>
            Entity Type
            <select className="select">
              <option>RESERVATION</option>
              <option>STAY</option>
            </select>
          </label>
          <label>
            Template
            <select className="select">
              <option>CONFIRM</option>
              <option>MODIFY</option>
              <option>CANCEL</option>
              <option>REMINDER</option>
              <option>CHECKOUT</option>
            </select>
          </label>
          <label>
            Channel
            <select className="select">
              <option>WHATSAPP</option>
              <option>SMS</option>
              <option>PRINT</option>
            </select>
          </label>
          <label>
            Destination Phone
            <input className="input" />
          </label>
        </div>
        <button className="btn primary">Send Confirmation</button>
      </section>
      <p className="note">Wire to `POST /v1/properties/:propertyId/confirmations/send`.</p>
    </FrontDeskShell>
  );
}
