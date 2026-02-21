import type { KitchenOrderStatus } from '../../../shared/types/contracts';

interface OrderStatusPillProps {
  status: KitchenOrderStatus;
}

export function OrderStatusPill({ status }: OrderStatusPillProps) {
  return <span className={`status-pill ${status.toLowerCase()}`}>{status}</span>;
}
