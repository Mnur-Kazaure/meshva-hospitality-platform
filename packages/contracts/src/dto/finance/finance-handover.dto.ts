import { ShiftType } from '../../enums/shift-type';

export interface FinanceHandoverDto {
  shiftType: ShiftType;
  cashOnHand: number;
  pendingRefunds?: number;
  notes: string;
}
