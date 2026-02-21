import { Inject, Injectable } from '@nestjs/common';
import { StayStatus } from '@meshva/contracts';
import {
  FRONT_DESK_REPOSITORY,
  FrontDeskRepository,
} from '../persistence/repositories/front-desk.repository';

@Injectable()
export class RoomsService {
  constructor(
    @Inject(FRONT_DESK_REPOSITORY)
    private readonly repository: FrontDeskRepository,
  ) {}

  async getBoard(tenantId: string, propertyId: string) {
    const rooms = await this.repository.listRooms({ tenantId, propertyId });
    const stays = await this.repository.listStays({ tenantId, propertyId });
    const roomTypes = await this.repository.listRoomTypes({ tenantId, propertyId });

    return rooms
      .map((room) => {
        const currentStay = stays.find(
          (stay) =>
            stay.status === StayStatus.OPEN &&
            stay.roomId === room.id,
        );
        const roomType = roomTypes.find((type) => type.id === room.roomTypeId);

        return {
          roomId: room.id,
          roomNumber: room.roomNumber,
          roomTypeId: room.roomTypeId,
          roomType: roomType?.name ?? 'Unknown',
          status: room.status,
          currentStayId: currentStay?.id,
        };
      })
      .sort((a, b) => a.roomNumber.localeCompare(b.roomNumber));
  }
}
