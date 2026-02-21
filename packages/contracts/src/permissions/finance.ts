export const FinancePermissions = {
  PAYMENT_RECORD: 'FINANCE.PAYMENT_RECORD',
  PAYMENT_VIEW: 'FINANCE.PAYMENT_VIEW',
  REFUND_EXECUTE: 'FINANCE.REFUND_EXECUTE',
  DAILY_CLOSE: 'FINANCE.DAILY_CLOSE',
  REPORT_VIEW: 'FINANCE.REPORT_VIEW',
  SHIFT_HANDOVER_CREATE: 'FINANCE.SHIFT_HANDOVER_CREATE',
} as const;

export type FinancePermission = (typeof FinancePermissions)[keyof typeof FinancePermissions];
