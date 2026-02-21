import type { KitchenOrderStatus } from '../../enums/kitchen-order-status';

export interface ChangeOrderStatusDto {
  toStatus: Exclude<KitchenOrderStatus, 'NEW' | 'CANCELLED' | 'CANCELLED_WITH_REASON'>;
}
