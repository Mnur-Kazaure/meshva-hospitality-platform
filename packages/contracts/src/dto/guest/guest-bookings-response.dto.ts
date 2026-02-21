export interface GuestBookingListItemDto {
  reservationId: string;
  confirmationCode: string;
  propertyId: string;
  propertyName: string;
  checkIn: string;
  checkOut: string;
  status: string;
  outstandingBalance: number;
}

export interface GuestBookingsResponseDto {
  upcoming: GuestBookingListItemDto[];
  history: GuestBookingListItemDto[];
}
