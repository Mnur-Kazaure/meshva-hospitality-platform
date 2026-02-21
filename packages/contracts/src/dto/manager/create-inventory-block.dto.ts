export interface CreateInventoryBlockDto {
  roomTypeId: string;
  from: string;
  to: string;
  unitsBlocked: number;
  reason: string;
}
