import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Max, Min } from 'class-validator';

export class ModifyGuestBookingDto {
  @IsOptional()
  @IsDateString()
  newCheckIn?: string;

  @IsOptional()
  @IsDateString()
  newCheckOut?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  adults?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  children?: number;
}
