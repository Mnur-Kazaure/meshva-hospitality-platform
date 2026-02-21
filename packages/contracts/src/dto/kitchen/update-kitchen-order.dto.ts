import type { CreateKitchenOrderItemDto } from './create-kitchen-order.dto';

export interface UpdateKitchenOrderDto {
  notes?: string;
  items?: CreateKitchenOrderItemDto[];
}
