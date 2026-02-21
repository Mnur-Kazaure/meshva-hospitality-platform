export const ImpersonationStatus = {
  ACTIVE: 'ACTIVE',
  ENDED: 'ENDED',
  EXPIRED: 'EXPIRED',
} as const;

export type ImpersonationStatus =
  (typeof ImpersonationStatus)[keyof typeof ImpersonationStatus];
