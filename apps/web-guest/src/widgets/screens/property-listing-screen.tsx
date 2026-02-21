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

export default function PropertyListingPage() {
  const searchParams = useSearchParams();
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

  const { data, isLoading, error, refetch } = usePublicSearchQuery(query);

  const baseParams = new URLSearchParams();
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
    <GuestShell title="Property Listing">
      {!query ? (
        <section className="card">
          <h3>Search details required</h3>
          <p className="note">Start from the search screen with check-in and check-out dates.</p>
          <Link className="btn primary" href="/home">
            Go to Search
          </Link>
        </section>
      ) : null}

      {query ? (
        <section className="card">
          <div className="header" style={{ marginBottom: 12 }}>
            <div>
              <h3 style={{ margin: 0 }}>Available properties</h3>
              <p className="note" style={{ margin: '4px 0 0' }}>
                {query.checkIn} to {query.checkOut}
              </p>
            </div>
            <div className="toolbar" style={{ marginTop: 0 }}>
              <button className="btn secondary" type="button" onClick={() => void refetch()}>
                Refresh
              </button>
              <Link className="btn primary" href="/home">
                New Search
              </Link>
            </div>
          </div>

          {isLoading ? <p className="note">Loading properties...</p> : null}
          {error ? <p className="auth-error">{error}</p> : null}

          {!isLoading && !error && data.rows.length === 0 ? (
            <p className="note">No properties found for this date range. Try different dates.</p>
          ) : null}

          <div className="grid cols-2">
            {data.rows.map((row) => {
              const minPrice = row.availableRoomTypes.reduce<number | undefined>((current, roomType) => {
                if (typeof roomType.startingPrice !== 'number') {
                  return current;
                }

                if (typeof current !== 'number' || roomType.startingPrice < current) {
                  return roomType.startingPrice;
                }

                return current;
              }, undefined);

              const linkParams = new URLSearchParams(baseParams);
              linkParams.set('propertyId', row.propertyId);

              return (
                <article className="card" key={row.propertyId}>
                  <h3 style={{ marginTop: 0 }}>{row.propertyName}</h3>
                  <p className="note" style={{ marginTop: 0 }}>
                    {row.city}, {row.state}
                  </p>
                  <p className="note">
                    {row.availableRoomTypes.length} room type(s) available
                    {typeof minPrice === 'number' ? ` • from ${formatCurrency(minPrice)}` : ''}
                  </p>
                  <div className="toolbar">
                    <Link className="btn secondary" href={`/property-details?${linkParams.toString()}`}>
                      View Details
                    </Link>
                    <Link className="btn primary" href={`/availability-room-selection?${linkParams.toString()}`}>
                      Select Room
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}
    </GuestShell>
  );
}
