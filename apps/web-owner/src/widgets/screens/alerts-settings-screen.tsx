'use client';

import { useState } from 'react';
import { OwnerShell } from '../dashboard-shell/ui/owner-shell';

export default function AlertsSettingsPage() {
  const [highSeverity, setHighSeverity] = useState(true);
  const [dailyCloseDigest, setDailyCloseDigest] = useState(true);
  const [dayUnlock, setDayUnlock] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [saved, setSaved] = useState(false);

  const onSave = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  return (
    <OwnerShell title="Alerts Settings">
      <section className="card">
        <div className="list-tight">
          <label>
            <input type="checkbox" checked={highSeverity} onChange={(event) => setHighSeverity(event.target.checked)} />
            {' '}
            WhatsApp alerts for HIGH severity exceptions
          </label>
          <label>
            <input type="checkbox" checked={dailyCloseDigest} onChange={(event) => setDailyCloseDigest(event.target.checked)} />
            {' '}
            Daily close non-compliance digest
          </label>
          <label>
            <input type="checkbox" checked={dayUnlock} onChange={(event) => setDayUnlock(event.target.checked)} />
            {' '}
            Day unlock immediate alert
          </label>
          <label>
            <input type="checkbox" checked={weeklyDigest} onChange={(event) => setWeeklyDigest(event.target.checked)} />
            {' '}
            Weekly portfolio digest by email
          </label>
        </div>
        <div className="toolbar">
          <button className="btn primary" onClick={onSave}>Save Preferences</button>
        </div>
      </section>
      {saved ? <p className="note">Preferences saved for this browser session.</p> : null}
      <p className="note">Server-side owner alert preference API is pending; runtime alerts remain active from event policies.</p>
    </OwnerShell>
  );
}
