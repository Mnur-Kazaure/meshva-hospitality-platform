import type { ExceptionSeverity } from '../../enums/exception-severity';
import type { OwnerExceptionType } from '../../enums/owner-exception-type';
import type { OwnerDateRangeQueryDto } from './owner-date-range-query.dto';

export interface OwnerExceptionsQueryDto extends OwnerDateRangeQueryDto {
  type?: OwnerExceptionType;
  severity?: ExceptionSeverity;
  acknowledged?: string;
}
