import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { ManagerPermissions } from '@meshva/contracts';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AppRequest } from '../../common/types/request-context';
import { ListMaintenanceTicketsDto } from '../housekeeping/dto/list-maintenance-tickets.dto';
import { HousekeepingService } from '../housekeeping/housekeeping.service';

@Controller('properties/:propertyId/manager/maintenance')
export class ManagerMaintenanceController {
  constructor(private readonly housekeepingService: HousekeepingService) {}

  @Get()
  @RequirePermissions(ManagerPermissions.MAINTENANCE_VIEW)
  list(
    @Param('propertyId') propertyId: string,
    @Req() request: AppRequest,
    @Query() query: ListMaintenanceTicketsDto,
  ) {
    return this.housekeepingService.listMaintenanceTickets(propertyId, request, query);
  }
}
