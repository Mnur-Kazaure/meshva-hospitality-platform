import { CancelReason } from '../../enums/cancel-reason';

export interface CancelReservationDto {
  reason: CancelReason;
  notes?: string;
}
