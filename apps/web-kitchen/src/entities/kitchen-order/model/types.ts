import type { KitchenOrderStatus } from '../../../shared/types/contracts';

export interface KitchenOrderItem {
  id: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  itemNote?: string;
}

export interface KitchenOrder {
  id: string;
  code: string;
  stayId: string;
  roomLabel: string;
  guestLabel: string;
  status: KitchenOrderStatus;
  notes?: string;
  items: KitchenOrderItem[];
  totalAmount: number;
  chargePostedAt: string | null;
  cancelledReason?: string;
  createdAt: string;
  updatedAt: string;
}
