'use client';

import Link from 'next/link';
import { formatCurrency, formatDate } from '../../shared/lib/utils/format';
import { useGuestBookingsQuery } from '../../entities/guest-booking/model/use-guest-bookings-query';
import { GuestShell } from '../dashboard-shell/ui/guest-shell';

function bookingActionHref(path: string, reservationId: string): string {
  const params = new URLSearchParams({ reservationId });
  return `${path}?${params.toString()}`;
}

export default function MyBookingsPage() {
  const { data, isLoading, error, refetch } = useGuestBookingsQuery();

  return (
    <GuestShell title="My Bookings">
      <section className="card">
        <div className="header" style={{ marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Upcoming</h3>
          <button className="btn secondary" type="button" onClick={() => void refetch()}>
            Refresh
          </button>
        </div>

        {isLoading ? <p className="note">Loading bookings...</p> : null}
        {error ? <p className="auth-error">{error}</p> : null}

        {!isLoading && !error && data.upcoming.length === 0 ? (
          <p className="note">No upcoming bookings yet.</p>
        ) : null}

        {data.upcoming.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Property</th>
                <th>Dates</th>
                <th>Status</th>
                <th>Balance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.upcoming.map((booking) => (
                <tr key={booking.reservationId}>
                  <td>{booking.confirmationCode}</td>
                  <td>{booking.propertyName}</td>
                  <td>
                    {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                  </td>
                  <td>{booking.status}</td>
                  <td>{formatCurrency(booking.outstandingBalance)}</td>
                  <td>
                    <div className="toolbar" style={{ marginTop: 0 }}>
                      <Link className="btn secondary" href={bookingActionHref('/booking-details', booking.reservationId)}>
                        View
                      </Link>
                      <Link className="btn secondary" href={bookingActionHref('/modify-booking', booking.reservationId)}>
                        Modify
                      </Link>
                      <Link className="btn danger" href={bookingActionHref('/cancel-booking', booking.reservationId)}>
                        Cancel
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>

      <section className="card" style={{ marginTop: 12 }}>
        <h3>History</h3>
        {!isLoading && !error && data.history.length === 0 ? (
          <p className="note">No past bookings.</p>
        ) : null}

        {data.history.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Property</th>
                <th>Dates</th>
                <th>Status</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {data.history.map((booking) => (
                <tr key={booking.reservationId}>
                  <td>{booking.confirmationCode}</td>
                  <td>{booking.propertyName}</td>
                  <td>
                    {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                  </td>
                  <td>{booking.status}</td>
                  <td>{formatCurrency(booking.outstandingBalance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>
    </GuestShell>
  );
}
