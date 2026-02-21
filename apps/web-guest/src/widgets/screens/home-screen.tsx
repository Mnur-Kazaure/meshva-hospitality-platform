'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GuestShell } from '../dashboard-shell/ui/guest-shell';

function toDateInput(daysOffset = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().slice(0, 10);
}

export default function SearchPage() {
  const router = useRouter();
  const [location, setLocation] = useState('Kano');
  const [checkIn, setCheckIn] = useState(toDateInput(1));
  const [checkOut, setCheckOut] = useState(toDateInput(2));
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const minCheckout = useMemo(() => {
    if (!checkIn) {
      return toDateInput(1);
    }

    const date = new Date(checkIn);
    date.setDate(date.getDate() + 1);
    return date.toISOString().slice(0, 10);
  }, [checkIn]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!checkIn || !checkOut || checkOut <= checkIn) {
      setError('Check-out date must be later than check-in date.');
      return;
    }

    setError(null);
    const params = new URLSearchParams({
      checkIn,
      checkOut,
      adults: String(adults),
      children: String(children),
    });

    if (location.trim()) {
      params.set('location', location.trim());
    }

    router.push(`/property-listing?${params.toString()}`);
  };

  return (
    <GuestShell title="Search Hotels">
      <section className="card hero">
        <h3>Find stays across Jigawa, Kano, and Katsina</h3>
        <form className="grid" onSubmit={onSubmit}>
          <div className="form-grid cols-4">
            <label>
              Location
              <input
                className="input"
                placeholder="Kano"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              />
            </label>
            <label>
              Check-in
              <input
                className="input"
                type="date"
                value={checkIn}
                onChange={(event) => {
                  const nextCheckIn = event.target.value;
                  setCheckIn(nextCheckIn);
                  if (checkOut <= nextCheckIn) {
                    const nextCheckOut = new Date(nextCheckIn);
                    nextCheckOut.setDate(nextCheckOut.getDate() + 1);
                    setCheckOut(nextCheckOut.toISOString().slice(0, 10));
                  }
                }}
                required
              />
            </label>
            <label>
              Check-out
              <input
                className="input"
                type="date"
                min={minCheckout}
                value={checkOut}
                onChange={(event) => setCheckOut(event.target.value)}
                required
              />
            </label>
            <label>
              Adults
              <select
                className="select"
                value={adults}
                onChange={(event) => setAdults(Number(event.target.value))}
              >
                {[1, 2, 3, 4, 5].map((count) => (
                  <option key={count} value={count}>
                    {count}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="form-grid cols-4">
            <label>
              Children
              <select
                className="select"
                value={children}
                onChange={(event) => setChildren(Number(event.target.value))}
              >
                {[0, 1, 2, 3, 4].map((count) => (
                  <option key={count} value={count}>
                    {count}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {error ? <p className="auth-error">{error}</p> : null}
          <div className="toolbar">
            <button className="btn primary" type="submit">
              Search Availability
            </button>
          </div>
        </form>
      </section>
    </GuestShell>
  );
}
