'use client';

import type { GuestBookingsResponseDto } from '../../../shared/types/contracts';
import { useAsyncQuery } from '../../../shared/lib/hooks/use-async-query';
import { listGuestBookings } from '../api/guest-booking-api';

const emptyBookings: GuestBookingsResponseDto = {
  upcoming: [],
  history: [],
};

export function useGuestBookingsQuery() {
  return useAsyncQuery<GuestBookingsResponseDto>('guest-bookings', listGuestBookings, emptyBookings);
}
