export const OwnerExportType = {
  REVENUE_SUMMARY: 'REVENUE_SUMMARY',
  DAILY_CLOSE_COMPLIANCE: 'DAILY_CLOSE_COMPLIANCE',
  EXCEPTIONS_LOG: 'EXCEPTIONS_LOG',
  PAYMENTS_LEDGER: 'PAYMENTS_LEDGER',
  OUTSTANDING_INVOICES: 'OUTSTANDING_INVOICES',
} as const;

export type OwnerExportType = (typeof OwnerExportType)[keyof typeof OwnerExportType];
