export interface PlatformAuditQueryDto {
  from?: string;
  to?: string;
  tenantIds?: string;
  actorUserId?: string;
  action?: string;
  entityType?: string;
  limit?: number;
}
