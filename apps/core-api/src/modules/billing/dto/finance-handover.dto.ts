import { ShiftType } from '@meshva/contracts';
import { IsEnum, IsNumber, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class FinanceHandoverDto {
  @IsEnum(ShiftType)
  shiftType!: ShiftType;

  @IsNumber()
  @Min(0)
  @Max(100000000)
  cashOnHand!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100000000)
  pendingRefunds?: number;

  @IsString()
  @Length(5, 1500)
  notes!: string;
}
