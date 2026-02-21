import { IsOptional, IsString, Length } from 'class-validator';

export class CancelGuestBookingDto {
  @IsOptional()
  @IsString()
  @Length(0, 200)
  reason?: string;
}
