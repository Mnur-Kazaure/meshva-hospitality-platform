import { IsEmail, IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateGuestDto {
  @IsString()
  @Length(2, 150)
  fullName!: string;

  @IsOptional()
  @IsString()
  @Length(7, 20)
  @Matches(/^[0-9+\-() ]+$/, { message: 'phone format is invalid' })
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  notes?: string;
}
