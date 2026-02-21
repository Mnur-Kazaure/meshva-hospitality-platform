'use client';

import type {
  PlatformAuditLogDto,
  PlatformAuditQueryDto,
  PlatformSystemHealthResponseDto,
} from '../../../shared/types/contracts';
import { useAsyncQuery } from '../../../shared/lib/hooks/use-async-query';
import { getPlatformSystemHealth, listPlatformAuditLogs } from '../api/platform-system-api';

const emptyHealth: PlatformSystemHealthResponseDto = {
  api: { uptimeSeconds: 0 },
  queues: {
    backlog: 0,
    failedJobs: 0,
  },
  tenants: {
    total: 0,
    active: 0,
  },
  trafficToday: {
    reservations: 0,
    payments: 0,
  },
};

export function usePlatformSystemHealthQuery() {
  return useAsyncQuery<PlatformSystemHealthResponseDto>(
    'platform-system-health',
    getPlatformSystemHealth,
    emptyHealth,
  );
}

export function usePlatformAuditQuery(query?: PlatformAuditQueryDto) {
  const queryKey = JSON.stringify(query ?? {});
  return useAsyncQuery<PlatformAuditLogDto[]>(
    `platform-audit:${queryKey}`,
    () => listPlatformAuditLogs(query),
    [],
  );
}
