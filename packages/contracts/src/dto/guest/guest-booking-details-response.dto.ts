export interface GuestBookingDetailsResponseDto {
  reservation: {
    id: string;
    code: string;
    guestId: string;
    roomTypeId: string;
    checkIn: string;
    checkOut: string;
    adults: number;
    children: number;
    status: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
  };
  property: {
    id: string;
    name: string;
    state: string;
    city: string;
  };
  canModify: boolean;
  canCancel: boolean;
  cancellationPolicy: string;
  outstandingBalance: number;
}
