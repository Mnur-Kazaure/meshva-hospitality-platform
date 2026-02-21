import { KitchenOrderStatuses } from '@meshva/contracts';
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class ListKitchenOrdersDto {
  @IsOptional()
  @IsEnum(KitchenOrderStatuses)
  status?: (typeof KitchenOrderStatuses)[keyof typeof KitchenOrderStatuses];

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;
}

