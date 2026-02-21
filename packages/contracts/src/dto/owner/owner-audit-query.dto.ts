import type { OwnerDateRangeQueryDto } from './owner-date-range-query.dto';

export interface OwnerAuditQueryDto extends OwnerDateRangeQueryDto {
  actorUserId?: string;
  action?: string;
  entityType?: string;
  limit?: number;
}
