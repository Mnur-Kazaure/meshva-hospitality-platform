import { ShiftType } from '../../enums/shift-type';

export interface CreateHandoverDto {
  shiftType: ShiftType;
  notes: string;
  exceptions?: string[];
}
