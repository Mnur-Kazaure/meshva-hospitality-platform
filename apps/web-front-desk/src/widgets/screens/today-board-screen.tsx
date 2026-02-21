import { FrontDeskShell } from '../dashboard-shell/ui/front-desk-shell';

export default function TodayBoardPage() {
  return (
    <FrontDeskShell title="Today Board">
      <div className="grid cols-2">
        <section className="card">
          <div>Arrivals Today</div>
          <div className="kpi">0</div>
        </section>
        <section className="card">
          <div>Departures Today</div>
          <div className="kpi">0</div>
        </section>
        <section className="card">
          <div>In-House Guests</div>
          <div className="kpi">0</div>
        </section>
        <section className="card">
          <div>Available Rooms Now</div>
          <div className="kpi">0</div>
        </section>
      </div>
      <p className="note">Wire to `GET /v1/properties/:propertyId/reservations/today-board`.</p>
    </FrontDeskShell>
  );
}
