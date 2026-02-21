import { RoomStatus } from '../../enums/room-status';

export interface SetOnboardingRoomStatusDto {
  status: RoomStatus;
  reason: string;
}

