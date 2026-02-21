import type {
  CancelGuestBookingResponseDto,
  GuestBookingCheckoutResponseDto,
  GuestBookingDetailsResponseDto,
  GuestBookingsResponseDto,
  ModifyGuestBookingResponseDto,
} from '../../../shared/types/contracts';

export type GuestBookingCheckoutResult = GuestBookingCheckoutResponseDto;
export type GuestBookingsResult = GuestBookingsResponseDto;
export type GuestBookingDetailsResult = GuestBookingDetailsResponseDto;
export type GuestBookingModifyResult = ModifyGuestBookingResponseDto;
export type GuestBookingCancelResult = CancelGuestBookingResponseDto;
