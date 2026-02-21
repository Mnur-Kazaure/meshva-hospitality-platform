import { IsDateString, IsOptional, IsString, Length } from 'class-validator';

export class ApproveOverrideRequestDto {
  @IsDateString()
  expiresAt!: string;

  @IsOptional()
  @IsString()
  @Length(0, 200)
  note?: string;
}
