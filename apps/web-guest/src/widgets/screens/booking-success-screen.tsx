'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { GuestShell } from '../dashboard-shell/ui/guest-shell';

export default function BookingSuccessPage() {
  const searchParams = useSearchParams();

  const confirmationCode = searchParams.get('confirmationCode') ?? '--';
  const reservationId = searchParams.get('reservationId') ?? '--';
  const checkIn = searchParams.get('checkIn') ?? '--';
  const checkOut = searchParams.get('checkOut') ?? '--';
  const paymentPolicy = searchParams.get('paymentPolicy') ?? 'PAY_AT_HOTEL';

  return (
    <GuestShell title="Booking Success">
      <section className="card success">
        <h3>Reservation Confirmed</h3>
        <p>Confirmation Code: <strong>{confirmationCode}</strong></p>
        <p>Reservation ID: {reservationId}</p>
        <p>Stay: {checkIn} to {checkOut}</p>
        <p className="note">Payment Mode: {paymentPolicy.replaceAll('_', ' ')}</p>
        <div className="toolbar">
          <Link className="btn primary" href="/my-bookings">
            View My Bookings
          </Link>
          <Link className="btn secondary" href="/home">
            New Search
          </Link>
        </div>
      </section>
    </GuestShell>
  );
}
