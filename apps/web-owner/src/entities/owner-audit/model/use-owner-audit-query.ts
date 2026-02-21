'use client';

import type { OwnerAuditLogDto, OwnerAuditQueryDto } from '../../../shared/types/contracts';
import { useAsyncQuery } from '../../../shared/lib/hooks/use-async-query';
import { listOwnerAuditLogs } from '../api/owner-audit-api';

export function useOwnerAuditQuery(query?: OwnerAuditQueryDto) {
  const queryKey = JSON.stringify(query ?? {});
  return useAsyncQuery<OwnerAuditLogDto[]>(
    `owner-audit:${queryKey}`,
    () => listOwnerAuditLogs(query),
    [],
  );
}
