import { Controller, Get, Param, Req } from '@nestjs/common';
import { FrontDeskPermissions } from '@meshva/contracts';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AppRequest } from '../../common/types/request-context';
import { RoomsService } from './rooms.service';

@Controller('properties/:propertyId/rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get('board')
  @RequirePermissions(FrontDeskPermissions.RESERVATION_VIEW)
  getBoard(@Param('propertyId') propertyId: string, @Req() request: AppRequest) {
    return this.roomsService.getBoard(request.context.tenantId, propertyId);
  }
}
