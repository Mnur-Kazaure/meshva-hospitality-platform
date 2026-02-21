import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { FrontDeskPermissions } from '@meshva/contracts';
import { IdempotentOperation } from '../../common/decorators/idempotent.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AppRequest } from '../../common/types/request-context';
import { CancelReservationDto } from './dto/cancel-reservation.dto';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ListReservationsDto } from './dto/list-reservations.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ReservationsService } from './reservations.service';

@Controller('properties/:propertyId/reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get()
  @RequirePermissions(FrontDeskPermissions.RESERVATION_VIEW)
  list(
    @Param('propertyId') propertyId: string,
    @Query() query: ListReservationsDto,
    @Req() request: AppRequest,
  ) {
    return this.reservationsService.list(propertyId, request, query);
  }

  @Get('/today-board')
  @RequirePermissions(FrontDeskPermissions.RESERVATION_VIEW)
  todayBoard(@Param('propertyId') propertyId: string, @Req() request: AppRequest) {
    return this.reservationsService.getTodayBoard(propertyId, request);
  }

  @Post()
  @RequirePermissions(FrontDeskPermissions.RESERVATION_CREATE)
  @IdempotentOperation()
  create(
    @Param('propertyId') propertyId: string,
    @Body() dto: CreateReservationDto,
    @Req() request: AppRequest,
  ) {
    return this.reservationsService.create(propertyId, request, dto);
  }

  @Patch(':reservationId')
  @RequirePermissions(FrontDeskPermissions.RESERVATION_EDIT)
  @IdempotentOperation()
  update(
    @Param('propertyId') propertyId: string,
    @Param('reservationId') reservationId: string,
    @Body() dto: UpdateReservationDto,
    @Req() request: AppRequest,
  ) {
    return this.reservationsService.update(propertyId, reservationId, request, dto);
  }

  @Post(':reservationId/cancel')
  @RequirePermissions(FrontDeskPermissions.RESERVATION_CANCEL)
  @IdempotentOperation()
  cancel(
    @Param('propertyId') propertyId: string,
    @Param('reservationId') reservationId: string,
    @Body() dto: CancelReservationDto,
    @Req() request: AppRequest,
  ) {
    return this.reservationsService.cancel(propertyId, reservationId, request, dto);
  }
}
