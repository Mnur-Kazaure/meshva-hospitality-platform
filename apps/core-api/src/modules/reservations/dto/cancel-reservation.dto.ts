import { CancelReason } from '@meshva/contracts';
import { IsEnum, IsOptional, IsString, Length } from 'class-validator';

export class CancelReservationDto {
  @IsEnum(CancelReason)
  reason!: CancelReason;

  @IsOptional()
  @IsString()
  @Length(0, 300)
  notes?: string;
}
