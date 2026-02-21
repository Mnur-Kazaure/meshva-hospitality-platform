import { IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class StaffResetPasswordDto {
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(168)
  inviteExpiryHours?: number;

  @IsOptional()
  @IsString()
  @Length(5, 200)
  reason?: string;
}
