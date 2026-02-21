import { IsString, Length } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @Length(24, 512)
  token!: string;

  @IsString()
  @Length(8, 200)
  newPassword!: string;
}
