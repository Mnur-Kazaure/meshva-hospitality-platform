import { IsDateString, IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class CheckInDto {
  @IsUUID()
  reservationId!: string;

  @IsOptional()
  @IsUUID()
  assignRoomId?: string;

  @IsOptional()
  @IsString()
  @Length(1, 40)
  idNumber?: string;

  @IsOptional()
  @IsDateString()
  checkInAt?: string;
}
