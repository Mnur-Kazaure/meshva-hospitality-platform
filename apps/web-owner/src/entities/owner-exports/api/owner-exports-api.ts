import type {
  CreateOwnerExportJobDto,
  OwnerExportJobDto,
} from '../../../shared/types/contracts';
import { apiClient } from '../../../shared/lib/api/client';

export function createOwnerExportJob(
  dto: CreateOwnerExportJobDto,
): Promise<OwnerExportJobDto> {
  return apiClient.post<OwnerExportJobDto>('/owner/exports', dto, 'owner-export-create');
}

export function getOwnerExportJob(exportId: string): Promise<OwnerExportJobDto> {
  return apiClient.get<OwnerExportJobDto>(`/owner/exports/${exportId}`);
}
