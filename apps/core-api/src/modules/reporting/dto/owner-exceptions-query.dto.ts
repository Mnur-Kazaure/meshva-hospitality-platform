import { ExceptionSeverity, OwnerExceptionType } from '@meshva/contracts';
import { IsBooleanString, IsEnum, IsOptional } from 'class-validator';
import { OwnerDateRangeQueryDto } from './owner-date-range-query.dto';

export class OwnerExceptionsQueryDto extends OwnerDateRangeQueryDto {
  @IsOptional()
  @IsEnum(OwnerExceptionType)
  type?: OwnerExceptionType;

  @IsOptional()
  @IsEnum(ExceptionSeverity)
  severity?: ExceptionSeverity;

  @IsOptional()
  @IsBooleanString()
  acknowledged?: string;
}
