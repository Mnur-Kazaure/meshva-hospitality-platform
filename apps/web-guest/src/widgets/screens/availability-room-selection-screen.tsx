'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import type { PublicSearchDto } from '../../shared/types/contracts';
import { formatCurrency } from '../../shared/lib/utils/format';
import { usePublicSearchQuery } from '../../entities/public-search/model/use-public-search-query';
import { GuestShell } from '../dashboard-shell/ui/guest-shell';

function parseNumber(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default function AvailabilityRoomSelectionPage() {
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('propertyId') ?? undefined;
  const location = searchParams.get('location') ?? '';
  const checkIn = searchParams.get('checkIn') ?? '';
  const checkOut = searchParams.get('checkOut') ?? '';
  const adults = parseNumber(searchParams.get('adults'));
  const children = parseNumber(searchParams.get('children'));

  const query = useMemo<PublicSearchDto | undefined>(() => {
    if (!checkIn || !checkOut) {
      return undefined;
    }

    return {
      location: location || undefined,
      checkIn,
      checkOut,
      adults,
      children,
    };
  }, [adults, checkIn, checkOut, children, location]);

  const { data, isLoading, error } = usePublicSearchQuery(query);

  const selectedProperty = propertyId ? data.rows.find((row) => row.propertyId === propertyId) : undefined;

  const baseParams = new URLSearchParams();
  if (propertyId) {
    baseParams.set('propertyId', propertyId);
  }
  if (location) {
    baseParams.set('location', location);
  }
  if (checkIn) {
    baseParams.set('checkIn', checkIn);
  }
  if (checkOut) {
    baseParams.set('checkOut', checkOut);
  }
  if (typeof adults === 'number') {
    baseParams.set('adults', String(adults));
  }
  if (typeof children === 'number') {
    baseParams.set('children', String(children));
  }

  return (
    <GuestShell title="Availability & Room Selection">
      {!propertyId ? (
        <section className="card">
          <h3>No property selected</h3>
          <p className="note">Pick a property from listing before selecting a room.</p>
          <Link className="btn primary" href="/property-listing">
            Go to Property Listing
          </Link>
        </section>
      ) : null}

      {propertyId ? (
        <section className="card">
          <div className="header" style={{ marginBottom: 12 }}>
            <div>
              <h3 style={{ margin: 0 }}>{selectedProperty?.propertyName ?? 'Selected Property'}</h3>
              <p className="note" style={{ margin: '4px 0 0' }}>
                {checkIn} to {checkOut}
              </p>
            </div>
            <Link className="btn secondary" href={`/property-details?${baseParams.toString()}`}>
              Property Details
            </Link>
          </div>

          {isLoading ? <p className="note">Loading room availability...</p> : null}
          {error ? <p className="auth-error">{error}</p> : null}

          {!isLoading && !error && !selectedProperty ? (
            <p className="note">No availability found for this property and date range.</p>
          ) : null}

          {selectedProperty ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Room Type</th>
                  <th>Available</th>
                  <th>Rate</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {selectedProperty.availableRoomTypes.map((roomType) => {
                  const confirmParams = new URLSearchParams(baseParams);
                  confirmParams.set('roomTypeId', roomType.roomTypeId);
                  confirmParams.set('roomTypeName', roomType.roomTypeName);
                  if (typeof roomType.startingPrice === 'number') {
                    confirmParams.set('startingPrice', String(roomType.startingPrice));
                  }

                  return (
                    <tr key={roomType.roomTypeId}>
                      <td>{roomType.roomTypeName}</td>
                      <td>{roomType.availableUnits}</td>
                      <td>
                        {typeof roomType.startingPrice === 'number'
                          ? formatCurrency(roomType.startingPrice)
                          : '--'}
                      </td>
                      <td>
                        <Link className="btn primary" href={`/booking-confirmation?${confirmParams.toString()}`}>
                          Select
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : null}
        </section>
      ) : null}
    </GuestShell>
  );
}
