'use client';

import type { OwnerExportJobDto } from '../../../shared/types/contracts';
import { useAsyncQuery } from '../../../shared/lib/hooks/use-async-query';
import { getOwnerExportJob } from '../api/owner-exports-api';

const emptyExportJob: OwnerExportJobDto = {
  id: '',
  tenantId: '',
  requestedByUserId: '',
  exportType: 'REVENUE_SUMMARY',
  format: 'CSV',
  fromDate: '',
  toDate: '',
  propertyIds: [],
  filtersJson: {},
  status: 'QUEUED',
  createdAt: '',
  updatedAt: '',
};

export function useOwnerExportJobQuery(exportId?: string) {
  return useAsyncQuery<OwnerExportJobDto>(
    `owner-export-job:${exportId ?? 'none'}`,
    () => {
      if (!exportId) {
        return Promise.resolve(emptyExportJob);
      }

      return getOwnerExportJob(exportId);
    },
    emptyExportJob,
  );
}
