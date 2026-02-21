import type { OwnerAuditLogDto, OwnerAuditQueryDto } from '../../../shared/types/contracts';
import { apiClient } from '../../../shared/lib/api/client';

function toAuditQuery(query?: OwnerAuditQueryDto): string {
  const params = new URLSearchParams();
  if (query?.from) {
    params.set('from', query.from);
  }
  if (query?.to) {
    params.set('to', query.to);
  }
  if (query?.propertyIds) {
    params.set('propertyIds', query.propertyIds);
  }
  if (query?.actorUserId) {
    params.set('actorUserId', query.actorUserId);
  }
  if (query?.action) {
    params.set('action', query.action);
  }
  if (query?.entityType) {
    params.set('entityType', query.entityType);
  }
  if (query?.limit) {
    params.set('limit', String(query.limit));
  }

  const payload = params.toString();
  return payload ? `?${payload}` : '';
}

export function listOwnerAuditLogs(query?: OwnerAuditQueryDto): Promise<OwnerAuditLogDto[]> {
  return apiClient.get<OwnerAuditLogDto[]>(`/owner/audit${toAuditQuery(query)}`);
}
