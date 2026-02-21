export const HousekeepingPermissions = {
  TASK_VIEW: 'HOUSEKEEPING.TASK_VIEW',
  TASK_UPDATE: 'HOUSEKEEPING.TASK_UPDATE',
  MAINTENANCE_CREATE: 'HOUSEKEEPING.MAINTENANCE_CREATE',
  MAINTENANCE_VIEW: 'HOUSEKEEPING.MAINTENANCE_VIEW',
} as const;

export type HousekeepingPermission =
  (typeof HousekeepingPermissions)[keyof typeof HousekeepingPermissions];
