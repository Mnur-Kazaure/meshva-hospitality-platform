export const OwnerExportStatus = {
  QUEUED: 'QUEUED',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;

export type OwnerExportStatus = (typeof OwnerExportStatus)[keyof typeof OwnerExportStatus];
