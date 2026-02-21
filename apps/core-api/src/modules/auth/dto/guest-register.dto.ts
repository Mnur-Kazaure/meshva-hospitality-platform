import { IsString, Length } from 'class-validator';

export class GuestRegisterDto {
  @IsString()
  @Length(2, 120)
  fullName!: string;

  @IsString()
  @Length(3, 160)
  identifier!: string;

  @IsString()
  @Length(8, 200)
  password!: string;
}
