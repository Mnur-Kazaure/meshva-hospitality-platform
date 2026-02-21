export const OwnerExportFormat = {
  CSV: 'CSV',
} as const;

export type OwnerExportFormat = (typeof OwnerExportFormat)[keyof typeof OwnerExportFormat];
