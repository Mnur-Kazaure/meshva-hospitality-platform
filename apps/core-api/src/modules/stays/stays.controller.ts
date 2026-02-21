import { Body, Controller, Param, Post, Req } from '@nestjs/common';
import { FrontDeskPermissions } from '@meshva/contracts';
import { IdempotentOperation } from '../../common/decorators/idempotent.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AppRequest } from '../../common/types/request-context';
import { ChangeRoomDto } from './dto/change-room.dto';
import { CheckInDto } from './dto/checkin.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { ExtendStayDto } from './dto/extend-stay.dto';
import { StaysService } from './stays.service';

@Controller('properties/:propertyId/stays')
export class StaysController {
  constructor(private readonly staysService: StaysService) {}

  @Post('checkin')
  @RequirePermissions(FrontDeskPermissions.STAY_CHECKIN)
  @IdempotentOperation()
  checkIn(
    @Param('propertyId') propertyId: string,
    @Req() request: AppRequest,
    @Body() dto: CheckInDto,
  ) {
    return this.staysService.checkIn(propertyId, request, dto);
  }

  @Post(':stayId/change-room')
  @RequirePermissions(FrontDeskPermissions.ROOM_ASSIGN)
  @IdempotentOperation()
  changeRoom(
    @Param('propertyId') propertyId: string,
    @Param('stayId') stayId: string,
    @Req() request: AppRequest,
    @Body() dto: ChangeRoomDto,
  ) {
    return this.staysService.changeRoom(propertyId, stayId, request, dto);
  }

  @Post(':stayId/extend')
  @RequirePermissions(FrontDeskPermissions.RESERVATION_EDIT)
  @IdempotentOperation()
  extend(
    @Param('propertyId') propertyId: string,
    @Param('stayId') stayId: string,
    @Req() request: AppRequest,
    @Body() dto: ExtendStayDto,
  ) {
    return this.staysService.extend(propertyId, stayId, request, dto);
  }

  @Post(':stayId/checkout')
  @RequirePermissions(FrontDeskPermissions.STAY_CHECKOUT)
  @IdempotentOperation()
  checkout(
    @Param('propertyId') propertyId: string,
    @Param('stayId') stayId: string,
    @Req() request: AppRequest,
    @Body() dto: CheckoutDto,
  ) {
    return this.staysService.checkout(propertyId, stayId, request, dto);
  }
}
