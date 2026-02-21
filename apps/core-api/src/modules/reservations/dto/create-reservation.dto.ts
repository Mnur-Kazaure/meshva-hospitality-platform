import { BookingSource, DepositStatus, ReservationStatus } from '@meshva/contracts';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ReservationGuestInputDto {
  @IsOptional()
  @IsUUID()
  guestId?: string;

  @IsString()
  @Length(2, 150)
  fullName!: string;

  @IsOptional()
  @IsString()
  @Length(7, 20)
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

export class CreateReservationDto {
  @ValidateNested()
  @Type(() => ReservationGuestInputDto)
  guest!: ReservationGuestInputDto;

  @IsUUID()
  roomTypeId!: string;

  @IsDateString()
  checkIn!: string;

  @IsDateString()
  checkOut!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  adults?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  children?: number;

  @IsEnum(BookingSource)
  source!: BookingSource;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  notes?: string;

  @IsEnum(DepositStatus)
  depositStatus!: DepositStatus;

  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;
}
