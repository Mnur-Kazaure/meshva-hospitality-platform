import { RoomStatus } from '@meshva/contracts';

export const SELLABLE_ROOM_STATUSES: ReadonlyArray<RoomStatus> = [
  RoomStatus.VACANT_READY,
  RoomStatus.READY,
];

export function isRoomSellable(status: RoomStatus): boolean {
  return SELLABLE_ROOM_STATUSES.includes(status);
}
