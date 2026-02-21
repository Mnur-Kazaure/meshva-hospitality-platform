import { IsOptional, IsString, Length } from 'class-validator';

export class AcceptStaffInviteDto {
  @IsString()
  @Length(24, 512)
  token!: string;

  @IsString()
  @Length(8, 200)
  newPassword!: string;

  @IsOptional()
  @IsString()
  @Length(2, 120)
  fullName?: string;
}
