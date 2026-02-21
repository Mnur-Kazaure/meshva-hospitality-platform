export interface UpdateReservationGuestDto {
  fullName?: string;
  phone?: string;
}

export interface UpdateReservationDto {
  checkIn?: string;
  checkOut?: string;
  roomTypeId?: string;
  notes?: string;
  guestUpdate?: UpdateReservationGuestDto;
}
