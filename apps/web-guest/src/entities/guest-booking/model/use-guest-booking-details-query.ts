'use client';

import type { GuestBookingDetailsResponseDto } from '../../../shared/types/contracts';
import { useAsyncQuery } from '../../../shared/lib/hooks/use-async-query';
import { getGuestBookingDetails } from '../api/guest-booking-api';

export function useGuestBookingDetailsQuery(reservationId?: string) {
  const key = reservationId ? `guest-booking-detail:${reservationId}` : 'guest-booking-detail:idle';

  return useAsyncQuery<GuestBookingDetailsResponseDto | null>(
    key,
    async () => {
      if (!reservationId) {
        return null;
      }

      return getGuestBookingDetails(reservationId);
    },
    null,
  );
}
