'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useGuestBookingDetailsQuery } from '../../entities/guest-booking/model/use-guest-booking-details-query';
import { useCancelGuestBookingMutation } from '../../features/guest-booking-cancel/model/use-cancel-guest-booking';
import { GuestShell } from '../dashboard-shell/ui/guest-shell';

export default function CancelBookingPage() {
  const searchParams = useSearchParams();
  const reservationId = searchParams.get('reservationId') ?? undefined;

  const detailsQuery = useGuestBookingDetailsQuery(reservationId);
  const cancelMutation = useCancelGuestBookingMutation();

  const [reason, setReason] = useState('');
  const [success, setSuccess] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccess(null);

    if (!reservationId) {
      return;
    }

    const result = await cancelMutation.mutate({
      reservationId,
      dto: {
        reason: reason.trim() || undefined,
      },
    });

    if (!result) {
      return;
    }

    setSuccess(`Reservation ${result.confirmationCode} cancelled successfully.`);
    await detailsQuery.refetch();
  };

  return (
    <GuestShell title="Cancel Booking">
      {!reservationId ? (
        <section className="card">
          <h3>Reservation required</h3>
          <p className="note">Open cancel from My Bookings.</p>
          <Link className="btn primary" href="/my-bookings">
            Go to My Bookings
          </Link>
        </section>
      ) : null}

      {reservationId ? (
        <section className="card">
          {detailsQuery.isLoading ? <p className="note">Loading booking...</p> : null}
          {detailsQuery.error ? <p className="auth-error">{detailsQuery.error}</p> : null}

          {detailsQuery.data && !detailsQuery.data.canCancel ? (
            <div className="alert">This booking can no longer be cancelled due to policy restrictions.</div>
          ) : null}

          {success ? <div className="alert">{success}</div> : null}
          {cancelMutation.error ? <p className="auth-error">{cancelMutation.error}</p> : null}

          {detailsQuery.data ? (
            <form className="grid" onSubmit={onSubmit}>
              <label>
                Reason
                <textarea
                  className="textarea"
                  placeholder="Why are you cancelling?"
                  maxLength={200}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                />
              </label>

              <div className="toolbar">
                <Link className="btn secondary" href={`/booking-details?reservationId=${reservationId}`}>
                  Back to Details
                </Link>
                <button
                  className="btn danger"
                  type="submit"
                  disabled={cancelMutation.isPending || !detailsQuery.data.canCancel}
                >
                  {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Reservation'}
                </button>
              </div>
            </form>
          ) : null}
        </section>
      ) : null}
    </GuestShell>
  );
}
