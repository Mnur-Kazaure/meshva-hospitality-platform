export interface CancelGuestBookingResponseDto {
  reservationId: string;
  confirmationCode: string;
  status: string;
  cancelReason?: string;
}
