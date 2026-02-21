import type {
  CancelGuestBookingDto,
  CancelGuestBookingResponseDto,
  CreateGuestBookingDto,
  GuestBookingCheckoutResponseDto,
  GuestBookingDetailsResponseDto,
  GuestBookingsResponseDto,
  ModifyGuestBookingDto,
  ModifyGuestBookingResponseDto,
} from '../../../shared/types/contracts';
import { apiClient } from '../../../shared/lib/api/client';

export async function checkoutGuestBooking(
  dto: CreateGuestBookingDto,
): Promise<GuestBookingCheckoutResponseDto> {
  return apiClient.post<GuestBookingCheckoutResponseDto>(
    '/guest/bookings/checkout',
    dto,
    'guest-booking-checkout',
  );
}

export async function listGuestBookings(): Promise<GuestBookingsResponseDto> {
  return apiClient.get<GuestBookingsResponseDto>('/guest/bookings');
}

export async function getGuestBookingDetails(
  reservationId: string,
): Promise<GuestBookingDetailsResponseDto> {
  return apiClient.get<GuestBookingDetailsResponseDto>(`/guest/bookings/${reservationId}`);
}

export async function modifyGuestBooking(
  reservationId: string,
  dto: ModifyGuestBookingDto,
): Promise<ModifyGuestBookingResponseDto> {
  return apiClient.post<ModifyGuestBookingResponseDto>(
    `/guest/bookings/${reservationId}/modify`,
    dto,
    'guest-booking-modify',
  );
}

export async function cancelGuestBooking(
  reservationId: string,
  dto: CancelGuestBookingDto,
): Promise<CancelGuestBookingResponseDto> {
  return apiClient.post<CancelGuestBookingResponseDto>(
    `/guest/bookings/${reservationId}/cancel`,
    dto,
    'guest-booking-cancel',
  );
}
