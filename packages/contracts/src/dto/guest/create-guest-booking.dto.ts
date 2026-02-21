export interface CreateGuestBookingDto {
  propertyId: string;
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  adults?: number;
  children?: number;
  fullName: string;
  phone: string;
  email?: string;
  specialRequest?: string;
}
