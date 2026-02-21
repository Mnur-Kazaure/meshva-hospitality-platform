import { Body, Controller, Param, Post, Req } from '@nestjs/common';
import { ManagerPermissions } from '@meshva/contracts';
import { IdempotentOperation } from '../../common/decorators/idempotent.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AppRequest } from '../../common/types/request-context';
import { SetOnboardingRoomStatusDto } from './dto/set-onboarding-room-status.dto';
import { ManagerService } from './manager.service';

@Controller('properties/:propertyId/manager/rooms')
export class ManagerRoomsController {
  constructor(private readonly managerService: ManagerService) {}

  @Post(':roomId/status')
  @RequirePermissions(ManagerPermissions.PROPERTY_SETTINGS_EDIT)
  @IdempotentOperation()
  setRoomStatus(
    @Param('propertyId') propertyId: string,
    @Param('roomId') roomId: string,
    @Req() request: AppRequest,
    @Body() dto: SetOnboardingRoomStatusDto,
  ) {
    return this.managerService.setRoomStatusForOnboarding(propertyId, roomId, request, dto);
  }
}

