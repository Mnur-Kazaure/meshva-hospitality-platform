'use client';

import type { CreateGuestBookingDto, GuestBookingCheckoutResponseDto } from '../../../shared/types/contracts';
import { useAsyncMutation } from '../../../shared/lib/hooks/use-async-mutation';
import { checkoutGuestBooking } from '../../../entities/guest-booking/api/guest-booking-api';

export function useGuestCheckoutMutation() {
  return useAsyncMutation<CreateGuestBookingDto, GuestBookingCheckoutResponseDto>(checkoutGuestBooking, {
    invalidatePrefixes: ['guest-bookings'],
  });
}
