import { OwnerPermissions } from '../../shared/types/contracts';

export const staffAuthConfig = {
  defaultHomePath: '/executive-overview',
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
    '/executive-overview': OwnerPermissions.PORTFOLIO_VIEW,
    '/properties': OwnerPermissions.PROPERTY_VIEW,
    '/exceptions-integrity': OwnerPermissions.EXCEPTIONS_VIEW,
    '/financial-summary': OwnerPermissions.FINANCE_VIEW,
    '/operations-snapshot': OwnerPermissions.OPERATIONS_VIEW,
    '/exports': OwnerPermissions.EXPORT,
    '/audit-viewer': OwnerPermissions.AUDIT_VIEW,
    '/alerts-settings': OwnerPermissions.ALERTS_CONFIG,
  },
} as const;
