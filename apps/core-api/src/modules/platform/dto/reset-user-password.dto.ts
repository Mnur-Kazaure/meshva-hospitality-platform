import { IsOptional, IsString, Length } from 'class-validator';

export class ResetUserPasswordDto {
  @IsOptional()
  @IsString()
  @Length(3, 200)
  reason?: string;
}
