'use client';

import type { CancelGuestBookingDto, CancelGuestBookingResponseDto } from '../../../shared/types/contracts';
import { useAsyncMutation } from '../../../shared/lib/hooks/use-async-mutation';
import { cancelGuestBooking } from '../../../entities/guest-booking/api/guest-booking-api';

interface CancelGuestBookingInput {
  reservationId: string;
  dto: CancelGuestBookingDto;
}

export function useCancelGuestBookingMutation() {
  return useAsyncMutation<CancelGuestBookingInput, CancelGuestBookingResponseDto>(
    ({ reservationId, dto }) => cancelGuestBooking(reservationId, dto),
    {
      invalidatePrefixes: ['guest-bookings', 'guest-booking-detail:'],
    },
  );
}
