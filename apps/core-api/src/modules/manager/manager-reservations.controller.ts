import { Body, Controller, Param, Post, Req } from '@nestjs/common';
import { ManagerPermissions } from '@meshva/contracts';
import { IdempotentOperation } from '../../common/decorators/idempotent.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AppRequest } from '../../common/types/request-context';
import { FinalizeNoShowDto } from './dto/finalize-no-show.dto';
import { ForceCancelDto } from './dto/force-cancel.dto';
import { ManagerService } from './manager.service';

@Controller('properties/:propertyId/reservations')
export class ManagerReservationsController {
  constructor(private readonly managerService: ManagerService) {}

  @Post(':reservationId/confirm')
  @RequirePermissions(ManagerPermissions.RESERVATION_OVERRIDE)
  @IdempotentOperation()
  confirm(
    @Param('propertyId') propertyId: string,
    @Param('reservationId') reservationId: string,
    @Req() request: AppRequest,
  ) {
    return this.managerService.confirmReservation(propertyId, request, reservationId);
  }

  @Post(':reservationId/no-show')
  @RequirePermissions(ManagerPermissions.NOSHOW_FINALIZE)
  @IdempotentOperation()
  finalizeNoShow(
    @Param('propertyId') propertyId: string,
    @Param('reservationId') reservationId: string,
    @Req() request: AppRequest,
    @Body() dto: FinalizeNoShowDto,
  ) {
    return this.managerService.finalizeNoShow(propertyId, request, reservationId, dto);
  }

  @Post(':reservationId/force-cancel')
  @RequirePermissions(ManagerPermissions.RESERVATION_OVERRIDE)
  @IdempotentOperation()
  forceCancel(
    @Param('propertyId') propertyId: string,
    @Param('reservationId') reservationId: string,
    @Req() request: AppRequest,
    @Body() dto: ForceCancelDto,
  ) {
    return this.managerService.forceCancel(propertyId, request, reservationId, dto);
  }
}
