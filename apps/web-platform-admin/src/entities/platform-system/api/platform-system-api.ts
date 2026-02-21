import type {
  PlatformAuditLogDto,
  PlatformAuditQueryDto,
  PlatformSystemHealthResponseDto,
} from '../../../shared/types/contracts';
import { apiClient } from '../../../shared/lib/api/client';

function toAuditQuery(query?: PlatformAuditQueryDto): string {
  const params = new URLSearchParams();
  if (query?.from) {
    params.set('from', query.from);
  }
  if (query?.to) {
    params.set('to', query.to);
  }
  if (query?.tenantIds) {
    params.set('tenantIds', query.tenantIds);
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

export function getPlatformSystemHealth(): Promise<PlatformSystemHealthResponseDto> {
  return apiClient.get<PlatformSystemHealthResponseDto>('/platform/system/health');
}

export function listPlatformAuditLogs(query?: PlatformAuditQueryDto): Promise<PlatformAuditLogDto[]> {
  return apiClient.get<PlatformAuditLogDto[]>(`/platform/audit${toAuditQuery(query)}`);
}
