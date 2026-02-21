'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { formatCurrency, formatDate } from '../../shared/lib/utils/format';
import { useGuestBookingDetailsQuery } from '../../entities/guest-booking/model/use-guest-booking-details-query';
import { GuestShell } from '../dashboard-shell/ui/guest-shell';

export default function BookingDetailsPage() {
  const searchParams = useSearchParams();
  const reservationId = searchParams.get('reservationId') ?? undefined;
  const { data, isLoading, error, refetch } = useGuestBookingDetailsQuery(reservationId);

  return (
    <GuestShell title="Booking Details">
      {!reservationId ? (
        <section className="card">
          <h3>Reservation required</h3>
          <p className="note">Open booking details from the My Bookings page.</p>
          <Link className="btn primary" href="/my-bookings">
            Go to My Bookings
          </Link>
        </section>
      ) : null}

      {reservationId ? (
        <section className="card">
          <div className="header" style={{ marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Reservation Snapshot</h3>
            <button className="btn secondary" type="button" onClick={() => void refetch()}>
              Refresh
            </button>
          </div>

          {isLoading ? <p className="note">Loading booking details...</p> : null}
          {error ? <p className="auth-error">{error}</p> : null}

          {data ? (
            <>
              <ul className="list">
                <li>Reservation code: {data.reservation.code}</li>
                <li>Status: {data.reservation.status}</li>
                <li>Property: {data.property.name}</li>
                <li>
                  Stay dates: {formatDate(data.reservation.checkIn)} - {formatDate(data.reservation.checkOut)}
                </li>
                <li>
                  Guests: {data.reservation.adults} adult(s), {data.reservation.children} child(ren)
                </li>
                <li>Outstanding balance: {formatCurrency(data.outstandingBalance)}</li>
                <li>Policy: {data.cancellationPolicy}</li>
              </ul>

              <div className="toolbar">
                {data.canModify ? (
                  <Link className="btn secondary" href={`/modify-booking?reservationId=${data.reservation.id}`}>
                    Modify Booking
                  </Link>
                ) : null}
                {data.canCancel ? (
                  <Link className="btn danger" href={`/cancel-booking?reservationId=${data.reservation.id}`}>
                    Cancel Booking
                  </Link>
                ) : null}
              </div>
            </>
          ) : null}
        </section>
      ) : null}
    </GuestShell>
  );
}
