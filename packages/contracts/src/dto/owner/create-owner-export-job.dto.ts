import type { OwnerExportFormat } from '../../enums/owner-export-format';
import type { OwnerExportType } from '../../enums/owner-export-type';

export interface CreateOwnerExportJobDto {
  exportType: OwnerExportType;
  from: string;
  to: string;
  propertyIds?: string;
  format: OwnerExportFormat;
}
