import { ReservationStatus } from '@meshva/contracts';
import { IsDateString, IsEnum, IsOptional, IsString, Length } from 'class-validator';

export class ListReservationsDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;

  @IsOptional()
  @IsString()
  @Length(0, 100)
  q?: string;
}
