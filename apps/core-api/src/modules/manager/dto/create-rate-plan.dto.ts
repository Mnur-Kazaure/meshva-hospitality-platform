import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Length, Min } from 'class-validator';

enum Currency {
  NGN = 'NGN',
}

export class CreateRatePlanDto {
  @IsString()
  @Length(2, 50)
  name!: string;

  @IsUUID()
  roomTypeId!: string;

  @IsNumber()
  @Min(0)
  baseRate!: number;

  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @IsDateString()
  effectiveFrom!: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;
}
