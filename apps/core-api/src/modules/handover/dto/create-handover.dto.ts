import { ShiftType } from '@meshva/contracts';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class CreateHandoverDto {
  @IsEnum(ShiftType)
  shiftType!: ShiftType;

  @IsString()
  @Length(5, 1500)
  notes!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  exceptions?: string[];
}
