import { PlatformAdminPermissions } from '../../shared/types/contracts';

export const staffAuthConfig = {
  defaultHomePath: '/tenants',
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
    '/tenants': PlatformAdminPermissions.TENANT_CREATE,
    '/tenant-details': PlatformAdminPermissions.TENANT_CREATE,
    '/subscriptions-plans': PlatformAdminPermissions.SUBSCRIPTION_MANAGE,
    '/feature-flags': PlatformAdminPermissions.FEATURE_FLAG_MANAGE,
    '/system-health': PlatformAdminPermissions.SYSTEM_VIEW,
    '/global-audit': PlatformAdminPermissions.AUDIT_VIEW,
    '/support-tools': PlatformAdminPermissions.IMPERSONATE,
    '/platform-metrics': PlatformAdminPermissions.SYSTEM_VIEW,
  },
} as const;
