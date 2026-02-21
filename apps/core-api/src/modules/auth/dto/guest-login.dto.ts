import { IsString, Length } from 'class-validator';

export class GuestLoginDto {
  @IsString()
  @Length(3, 160)
  identifier!: string;

  @IsString()
  @Length(8, 200)
  password!: string;
}
