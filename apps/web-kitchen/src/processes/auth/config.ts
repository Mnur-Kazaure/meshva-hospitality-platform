import { KitchenPermissions } from '../../shared/types/contracts';

export const staffAuthConfig = {
  defaultHomePath: '/orders',
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
    '/orders': KitchenPermissions.ORDER_VIEW,
    '/new-order': KitchenPermissions.ORDER_CREATE,
    '/menu-management': KitchenPermissions.MENU_VIEW,
    '/order-history': KitchenPermissions.ORDER_VIEW,
    '/reports': KitchenPermissions.REPORTS_VIEW,
    '/settings': KitchenPermissions.ORDER_VIEW,
  },
} as const;
