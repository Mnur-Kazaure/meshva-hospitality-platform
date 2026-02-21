import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { HousekeepingPermissions } from '@meshva/contracts';
import { IdempotentOperation } from '../../common/decorators/idempotent.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AppRequest } from '../../common/types/request-context';
import { CreateMaintenanceTicketDto } from './dto/create-maintenance-ticket.dto';
import { ListMaintenanceTicketsDto } from './dto/list-maintenance-tickets.dto';
import { HousekeepingService } from './housekeeping.service';

@Controller('properties/:propertyId/maintenance')
export class MaintenanceController {
  constructor(private readonly housekeepingService: HousekeepingService) {}

  @Post()
  @RequirePermissions(HousekeepingPermissions.MAINTENANCE_CREATE)
  @IdempotentOperation()
  create(
    @Param('propertyId') propertyId: string,
    @Req() request: AppRequest,
    @Body() dto: CreateMaintenanceTicketDto,
  ) {
    return this.housekeepingService.createMaintenanceTicket(propertyId, request, dto);
  }

  @Get()
  @RequirePermissions(HousekeepingPermissions.MAINTENANCE_VIEW)
  list(
    @Param('propertyId') propertyId: string,
    @Req() request: AppRequest,
    @Query() query: ListMaintenanceTicketsDto,
  ) {
    return this.housekeepingService.listMaintenanceTickets(propertyId, request, query);
  }
}
