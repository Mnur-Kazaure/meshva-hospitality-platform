import { IsDateString, IsString, IsUUID } from 'class-validator';

export class CheckAvailabilityDto {
  @IsUUID()
  roomTypeId!: string;

  @IsDateString()
  checkIn!: string;

  @IsDateString()
  checkOut!: string;
}
