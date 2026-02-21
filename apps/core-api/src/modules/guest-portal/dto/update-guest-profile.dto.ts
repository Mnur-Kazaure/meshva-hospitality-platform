import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class UpdateGuestProfileDto {
  @IsOptional()
  @IsString()
  @Length(2, 150)
  fullName?: string;

  @IsOptional()
  @IsString()
  @Length(7, 20)
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
