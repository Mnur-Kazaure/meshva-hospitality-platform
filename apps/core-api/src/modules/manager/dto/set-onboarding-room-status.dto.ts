import { RoomStatus } from '@meshva/contracts';
import { IsEnum, IsString, Length } from 'class-validator';

export class SetOnboardingRoomStatusDto {
  @IsEnum(RoomStatus)
  status!: RoomStatus;

  @IsString()
  @Length(5, 200)
  reason!: string;
}

