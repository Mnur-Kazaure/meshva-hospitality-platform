import { BookingSource } from '../../enums/booking-source';
import { DepositStatus } from '../../enums/deposit-status';
import { ReservationStatus } from '../../enums/reservation-status';

export interface CreateReservationGuestDto {
  guestId?: string;
  fullName: string;
  phone?: string;
}

export interface CreateReservationDto {
  guest: CreateReservationGuestDto;
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  adults?: number;
  children?: number;
  source: BookingSource;
  notes?: string;
  depositStatus: DepositStatus;
  status?: ReservationStatus.CONFIRMED | ReservationStatus.PENDING_CONFIRM;
}
