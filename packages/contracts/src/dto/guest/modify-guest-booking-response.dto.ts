export interface ModifyGuestBookingResponseDto {
  reservationId: string;
  confirmationCode: string;
  status: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
}
