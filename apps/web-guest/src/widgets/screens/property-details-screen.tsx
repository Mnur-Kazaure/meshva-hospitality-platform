'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { formatCurrency } from '../../shared/lib/utils/format';
import { usePropertyDetailsQuery } from '../../entities/property/model/use-property-details-query';
import { GuestShell } from '../dashboard-shell/ui/guest-shell';

export default function PropertyDetailsPage() {
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('propertyId') ?? undefined;

  const { data, isLoading, error } = usePropertyDetailsQuery(propertyId);

  const baseParams = new URLSearchParams();
  const location = searchParams.get('location');
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');
  const adults = searchParams.get('adults');
  const children = searchParams.get('children');

  if (location) {
    baseParams.set('location', location);
  }
  if (checkIn) {
    baseParams.set('checkIn', checkIn);
  }
  if (checkOut) {
    baseParams.set('checkOut', checkOut);
  }
  if (adults) {
    baseParams.set('adults', adults);
  }
  if (children) {
    baseParams.set('children', children);
  }
  if (propertyId) {
    baseParams.set('propertyId', propertyId);
  }

  return (
    <GuestShell title="Property Details">
      {!propertyId ? (
        <section className="card">
          <h3>No property selected</h3>
          <p className="note">Go back to listing and choose a property.</p>
          <Link className="btn primary" href="/property-listing">
            Go to Property Listing
          </Link>
        </section>
      ) : null}

      {propertyId ? (
        <>
          {isLoading ? <p className="note">Loading property details...</p> : null}
          {error ? <p className="auth-error">{error}</p> : null}

          {data ? (
            <div className="grid cols-2">
              <section className="card">
                <h3>{data.property.name}</h3>
                <p className="note" style={{ marginTop: 0 }}>
                  {data.property.city}, {data.property.state}
                </p>
                <ul className="list">
                  <li>Check-in: {data.policies.checkInTime}</li>
                  <li>Check-out: {data.policies.checkOutTime}</li>
                  <li>Cancellation: {data.policies.cancellation}</li>
                  <li>
                    Amenities: {data.amenities.length > 0 ? data.amenities.join(', ') : 'Not provided'}
                  </li>
                </ul>
              </section>

              <section className="card">
                <h3>Room Types</h3>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Room Type</th>
                      <th>Units</th>
                      <th>Starting Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.roomTypes.map((roomType) => (
                      <tr key={roomType.id}>
                        <td>{roomType.name}</td>
                        <td>{roomType.totalUnits}</td>
                        <td>
                          {typeof roomType.startingPrice === 'number'
                            ? formatCurrency(roomType.startingPrice)
                            : '--'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="toolbar">
                  <Link className="btn primary" href={`/availability-room-selection?${baseParams.toString()}`}>
                    View Availability
                  </Link>
                </div>
              </section>
            </div>
          ) : null}
        </>
      ) : null}
    </GuestShell>
  );
}
