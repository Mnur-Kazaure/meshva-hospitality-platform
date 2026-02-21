import { IsString, Length } from 'class-validator';

export class ForgotPasswordDto {
  @IsString()
  @Length(3, 160)
  identifier!: string;
}
