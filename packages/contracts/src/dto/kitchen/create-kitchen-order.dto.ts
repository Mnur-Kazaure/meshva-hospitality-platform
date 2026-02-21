export interface CreateKitchenOrderItemDto {
  menuItemId: string;
  quantity: number;
  itemNote?: string;
}

export interface CreateKitchenOrderDto {
  stayId: string;
  notes?: string;
  items: CreateKitchenOrderItemDto[];
}
