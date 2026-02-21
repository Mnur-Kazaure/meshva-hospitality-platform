import { ManagerPermissions } from '../../shared/types/contracts';

export const staffAuthConfig = {
  defaultHomePath: '/ops-overview',
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
    '/ops-overview': ManagerPermissions.OPS_VIEW,
    '/approvals': ManagerPermissions.APPROVAL_VIEW,
    '/inventory-rates': ManagerPermissions.INVENTORY_MANAGE,
    '/reservations-stays': ManagerPermissions.RESERVATION_OVERRIDE,
    '/room-oversight': ManagerPermissions.OPS_VIEW,
    '/staff-activity': ManagerPermissions.STAFF_ACTIVITY_VIEW,
    '/staff-management': ManagerPermissions.STAFF_VIEW,
    '/reports': ManagerPermissions.OPS_VIEW,
    '/settings': ManagerPermissions.PROPERTY_SETTINGS_EDIT,
  },
} as const;
