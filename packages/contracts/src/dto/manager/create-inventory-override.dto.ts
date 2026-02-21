export interface CreateInventoryOverrideDto {
  roomTypeId: string;
  date: string;
  newAvailableUnits: number;
  reason: string;
}
