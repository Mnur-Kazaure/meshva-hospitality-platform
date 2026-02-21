export interface GuestBookingCheckoutResponseDto {
  reservationId: string;
  confirmationCode: string;
  summary: {
    propertyId: string;
    roomTypeId: string;
    checkIn: string;
    checkOut: string;
    fullName: string;
    phone: string;
    status: string;
    paymentPolicy: string;
  };
}
