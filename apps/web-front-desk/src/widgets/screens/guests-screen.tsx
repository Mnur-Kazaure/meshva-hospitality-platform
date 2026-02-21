import { FrontDeskShell } from '../dashboard-shell/ui/front-desk-shell';

export default function GuestsPage() {
  return (
    <FrontDeskShell title="Guests">
      <div className="toolbar">
        <input className="input" placeholder="Search guests" />
        <button className="btn primary">Create Guest</button>
      </div>
      <section className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={3}>No guests loaded yet</td>
            </tr>
          </tbody>
        </table>
      </section>
      <p className="note">Wire to `GET/POST/PATCH /v1/properties/:propertyId/guests`.</p>
    </FrontDeskShell>
  );
}
