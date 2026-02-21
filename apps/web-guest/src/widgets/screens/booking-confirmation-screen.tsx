'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { CreateGuestBookingDto } from '../../shared/types/contracts';
import { formatCurrency } from '../../shared/lib/utils/format';
import { useGuestSession } from '../../processes/auth/model/guest-session-context';
import { useGuestCheckoutMutation } from '../../features/guest-checkout/model/use-guest-checkout';
import { GuestShell } from '../dashboard-shell/ui/guest-shell';

function parseNumber(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function BookingConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session } = useGuestSession();

  const propertyId = searchParams.get('propertyId') ?? '';
  const roomTypeId = searchParams.get('roomTypeId') ?? '';
  const roomTypeName = searchParams.get('roomTypeName') ?? 'Selected room';
  const checkIn = searchParams.get('checkIn') ?? '';
  const checkOut = searchParams.get('checkOut') ?? '';
  const adults = parseNumber(searchParams.get('adults'), 1);
  const children = parseNumber(searchParams.get('children'), 0);
  const startingPrice = parseNumber(searchParams.get('startingPrice'), 0);

  const [fullName, setFullName] = useState(session?.guest.fullName ?? '');
  const [phone, setPhone] = useState(session?.guest.phone ?? '');
  const [email, setEmail] = useState(session?.guest.email ?? '');
  const [specialRequest, setSpecialRequest] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { mutate, isPending, error: mutationError } = useGuestCheckoutMutation();

  const canSubmit = useMemo(
    () => Boolean(propertyId && roomTypeId && checkIn && checkOut && fullName.trim() && phone.trim()),
    [propertyId, roomTypeId, checkIn, checkOut, fullName, phone],
  );

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!canSubmit) {
      setError('Complete all required booking fields before submitting.');
      return;
    }

    const payload: CreateGuestBookingDto = {
      propertyId,
      roomTypeId,
      checkIn,
      checkOut,
      adults,
      children,
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      specialRequest: specialRequest.trim() || undefined,
    };

    const result = await mutate(payload);
    if (!result) {
      return;
    }

    const successParams = new URLSearchParams({
      reservationId: result.reservationId,
      confirmationCode: result.confirmationCode,
      propertyId: result.summary.propertyId,
      roomTypeId: result.summary.roomTypeId,
      checkIn: result.summary.checkIn,
      checkOut: result.summary.checkOut,
      fullName: result.summary.fullName,
      phone: result.summary.phone,
      status: result.summary.status,
      paymentPolicy: result.summary.paymentPolicy,
    });

    router.push(`/booking-success?${successParams.toString()}`);
  };

  return (
    <GuestShell title="Booking Confirmation">
      <section className="card">
        <div className="grid cols-2">
          <div className="card" style={{ padding: 12 }}>
            <h3 style={{ marginTop: 0 }}>Selected Stay</h3>
            <ul className="list">
              <li>Room type: {roomTypeName}</li>
              <li>Check-in: {checkIn || '--'}</li>
              <li>Check-out: {checkOut || '--'}</li>
              <li>Adults: {adults}</li>
              <li>Children: {children}</li>
              <li>Starting price: {startingPrice > 0 ? formatCurrency(startingPrice) : 'TBD'}</li>
            </ul>
          </div>

          <form className="card" style={{ padding: 12 }} onSubmit={onSubmit}>
            <h3 style={{ marginTop: 0 }}>Guest Details</h3>
            {error ? <p className="auth-error">{error}</p> : null}
            {mutationError ? <p className="auth-error">{mutationError}</p> : null}
            <div className="form-grid cols-1">
              <label>
                Full Name *
                <input
                  className="input"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                />
              </label>
              <label>
                Phone (WhatsApp) *
                <input
                  className="input"
                  placeholder="+234..."
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  required
                />
              </label>
              <label>
                Email
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
              <label>
                Special Request
                <textarea
                  className="textarea"
                  maxLength={300}
                  value={specialRequest}
                  onChange={(event) => setSpecialRequest(event.target.value)}
                  placeholder="Late arrival, allergies, accessibility"
                />
              </label>
            </div>
            <div className="toolbar">
              <button className="btn secondary" type="button" onClick={() => router.back()} disabled={isPending}>
                Back
              </button>
              <button className="btn primary" type="submit" disabled={isPending || !canSubmit}>
                {isPending ? 'Confirming...' : 'Confirm Booking'}
              </button>
            </div>
          </form>
        </div>
      </section>
      <p className="note">Booking is saved through `POST /v1/guest/bookings/checkout` with idempotency.</p>
    </GuestShell>
  );
}
