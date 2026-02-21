import { HousekeepingPermissions } from '../../shared/types/contracts';

export const staffAuthConfig = {
  defaultHomePath: '/task-board',
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
    '/task-board': HousekeepingPermissions.TASK_VIEW,
    '/room-status-board': HousekeepingPermissions.TASK_VIEW,
    '/my-tasks': HousekeepingPermissions.TASK_VIEW,
    '/maintenance-reports': HousekeepingPermissions.MAINTENANCE_VIEW,
    '/task-history': HousekeepingPermissions.TASK_VIEW,
  },
} as const;
