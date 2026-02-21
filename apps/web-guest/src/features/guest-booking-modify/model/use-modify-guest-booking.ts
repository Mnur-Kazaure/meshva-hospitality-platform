'use client';

import type { ModifyGuestBookingDto, ModifyGuestBookingResponseDto } from '../../../shared/types/contracts';
import { useAsyncMutation } from '../../../shared/lib/hooks/use-async-mutation';
import { modifyGuestBooking } from '../../../entities/guest-booking/api/guest-booking-api';

interface ModifyGuestBookingInput {
  reservationId: string;
  dto: ModifyGuestBookingDto;
}

export function useModifyGuestBookingMutation() {
  return useAsyncMutation<ModifyGuestBookingInput, ModifyGuestBookingResponseDto>(
    ({ reservationId, dto }) => modifyGuestBooking(reservationId, dto),
    {
      invalidatePrefixes: ['guest-bookings', 'guest-booking-detail:'],
    },
  );
}
