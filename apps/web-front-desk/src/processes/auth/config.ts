import { FrontDeskPermissions } from '../../shared/types/contracts';

export const staffAuthConfig = {
  defaultHomePath: '/today-board',
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
    '/today-board': FrontDeskPermissions.RESERVATION_VIEW,
    '/room-board': FrontDeskPermissions.RESERVATION_VIEW,
    '/reservations': FrontDeskPermissions.RESERVATION_VIEW,
    '/new-booking': FrontDeskPermissions.RESERVATION_CREATE,
    '/checkin-checkout': FrontDeskPermissions.STAY_CHECKIN,
    '/guests': FrontDeskPermissions.GUEST_VIEW,
    '/confirmations': FrontDeskPermissions.CONFIRMATION_SEND,
    '/shift-handover': FrontDeskPermissions.SHIFT_HANDOVER_CREATE,
  },
} as const;
