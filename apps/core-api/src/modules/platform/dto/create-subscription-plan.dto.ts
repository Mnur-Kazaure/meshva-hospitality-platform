import { SubscriptionPlanCode } from '@meshva/contracts';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

export class CreateSubscriptionPlanDto {
  @IsEnum(SubscriptionPlanCode)
  code!: SubscriptionPlanCode;

  @IsString()
  @Length(2, 60)
  name!: string;

  @IsOptional()
  @IsString()
  @Length(3, 240)
  description?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  propertyLimit!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  userLimit!: number;

  @IsOptional()
  @IsObject()
  features?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
