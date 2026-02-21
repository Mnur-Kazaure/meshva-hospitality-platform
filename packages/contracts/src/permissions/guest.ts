export const GuestPermissions = {
  BOOKING_VIEW: 'GUEST.BOOKING_VIEW',
  BOOKING_CREATE: 'GUEST.BOOKING_CREATE',
  BOOKING_MODIFY: 'GUEST.BOOKING_MODIFY',
  BOOKING_CANCEL: 'GUEST.BOOKING_CANCEL',
  PROFILE_EDIT: 'GUEST.PROFILE_EDIT',
} as const;

export type GuestPermission = (typeof GuestPermissions)[keyof typeof GuestPermissions];
