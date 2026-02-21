'use client';

import type { CreateOwnerExportJobDto, OwnerExportJobDto } from '../../../shared/types/contracts';
import { useAsyncMutation } from '../../../shared/lib/hooks/use-async-mutation';
import { createOwnerExportJob } from '../../../entities/owner-exports/api/owner-exports-api';

export function useOwnerExportCreateMutation() {
  return useAsyncMutation<CreateOwnerExportJobDto, OwnerExportJobDto>(createOwnerExportJob, {
    invalidatePrefixes: ['owner-export-job:', 'owner-overview:', 'owner-properties:'],
  });
}
