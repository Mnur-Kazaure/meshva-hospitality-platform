import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateKitchenOrderItemDto {
  @IsUUID()
  menuItemId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  quantity!: number;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  itemNote?: string;
}

export class CreateKitchenOrderDto {
  @IsUUID()
  stayId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreateKitchenOrderItemDto)
  items!: CreateKitchenOrderItemDto[];
}

