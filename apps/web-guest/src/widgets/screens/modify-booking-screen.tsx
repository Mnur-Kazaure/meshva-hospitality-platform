'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { ModifyGuestBookingDto } from '../../shared/types/contracts';
import { useGuestBookingDetailsQuery } from '../../entities/guest-booking/model/use-guest-booking-details-query';
import { useModifyGuestBookingMutation } from '../../features/guest-booking-modify/model/use-modify-guest-booking';
import { GuestShell } from '../dashboard-shell/ui/guest-shell';

export default function ModifyBookingPage() {
  const searchParams = useSearchParams();
  const reservationId = searchParams.get('reservationId') ?? undefined;

  const detailsQuery = useGuestBookingDetailsQuery(reservationId);
  const modifyMutation = useModifyGuestBookingMutation();

  const [newCheckIn, setNewCheckIn] = useState('');
  const [newCheckOut, setNewCheckOut] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!detailsQuery.data) {
      return;
    }

    setNewCheckIn(detailsQuery.data.reservation.checkIn);
    setNewCheckOut(detailsQuery.data.reservation.checkOut);
    setAdults(detailsQuery.data.reservation.adults);
    setChildren(detailsQuery.data.reservation.children);
  }, [detailsQuery.data]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccess(null);

    if (!reservationId) {
      return;
    }

    const dto: ModifyGuestBookingDto = {
      newCheckIn,
      newCheckOut,
      adults,
      children,
    };

    const result = await modifyMutation.mutate({ reservationId, dto });
    if (!result) {
      return;
    }

    setSuccess(`Booking updated. New stay dates: ${result.checkIn} to ${result.checkOut}.`);
    await detailsQuery.refetch();
  };

  return (
    <GuestShell title="Modify Booking">
      {!reservationId ? (
        <section className="card">
          <h3>Reservation required</h3>
          <p className="note">Open modify from My Bookings.</p>
          <Link className="btn primary" href="/my-bookings">
            Go to My Bookings
          </Link>
        </section>
      ) : null}

      {reservationId ? (
        <section className="card">
          {detailsQuery.isLoading ? <p className="note">Loading booking...</p> : null}
          {detailsQuery.error ? <p className="auth-error">{detailsQuery.error}</p> : null}

          {detailsQuery.data && !detailsQuery.data.canModify ? (
            <div className="alert">This booking cannot be modified under current policy.</div>
          ) : null}

          {success ? <div className="alert">{success}</div> : null}
          {modifyMutation.error ? <p className="auth-error">{modifyMutation.error}</p> : null}

          {detailsQuery.data ? (
            <form className="grid" onSubmit={onSubmit}>
              <div className="form-grid cols-3">
                <label>
                  New Check-in
                  <input
                    className="input"
                    type="date"
                    value={newCheckIn}
                    onChange={(event) => setNewCheckIn(event.target.value)}
                    required
                  />
                </label>
                <label>
                  New Check-out
                  <input
                    className="input"
                    type="date"
                    value={newCheckOut}
                    onChange={(event) => setNewCheckOut(event.target.value)}
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

              <div className="form-grid cols-3">
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

              <div className="toolbar">
                <Link className="btn secondary" href={`/booking-details?reservationId=${reservationId}`}>
                  Back to Details
                </Link>
                <button
                  className="btn primary"
                  type="submit"
                  disabled={modifyMutation.isPending || !detailsQuery.data.canModify}
                >
                  {modifyMutation.isPending ? 'Submitting...' : 'Submit Modification'}
                </button>
              </div>
            </form>
          ) : null}
        </section>
      ) : null}
    </GuestShell>
  );
}
