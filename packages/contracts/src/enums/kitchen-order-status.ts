export const KitchenOrderStatuses = {
  NEW: 'NEW',
  ACCEPTED: 'ACCEPTED',
  IN_PREP: 'IN_PREP',
  READY: 'READY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  CANCELLED_WITH_REASON: 'CANCELLED_WITH_REASON',
} as const;

export type KitchenOrderStatus = (typeof KitchenOrderStatuses)[keyof typeof KitchenOrderStatuses];
