import { FinancePermissions } from '../../shared/types/contracts';

export const staffAuthConfig = {
  defaultHomePath: '/finance-overview',
  publicPaths: [
    '/login',
    '/accept-invite',
    '/forgot-password',
    '/reset-password',
    '/account-disabled',
    '/session-expired',
    '/access-denied',
  ],
  routePermissions: {
    '/finance-overview': FinancePermissions.PAYMENT_VIEW,
    '/invoices-folios': FinancePermissions.PAYMENT_VIEW,
    '/payments': FinancePermissions.PAYMENT_RECORD,
    '/refunds': FinancePermissions.REFUND_EXECUTE,
    '/daily-close': FinancePermissions.DAILY_CLOSE,
    '/reports': FinancePermissions.REPORT_VIEW,
    '/shift-handover': FinancePermissions.SHIFT_HANDOVER_CREATE,
  },
} as const;
