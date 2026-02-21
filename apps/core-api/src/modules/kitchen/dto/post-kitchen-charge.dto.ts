import { IsOptional, IsString, MaxLength } from 'class-validator';

export class PostKitchenChargeDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;
}

