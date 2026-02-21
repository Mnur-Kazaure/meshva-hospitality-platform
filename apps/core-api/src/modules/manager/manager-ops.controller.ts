import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { ManagerPermissions } from '@meshva/contracts';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AppRequest } from '../../common/types/request-context';
import { ManagerOverviewQueryDto } from './dto/manager-overview-query.dto';
import { ManagerService } from './manager.service';

@Controller('properties/:propertyId/manager')
export class ManagerOpsController {
  constructor(private readonly managerService: ManagerService) {}

  @Get('overview')
  @RequirePermissions(ManagerPermissions.OPS_VIEW)
  overview(
    @Param('propertyId') propertyId: string,
    @Req() request: AppRequest,
    @Query() query: ManagerOverviewQueryDto,
  ) {
    return this.managerService.getOverview(propertyId, request, query);
  }

  @Get('room-oversight')
  @RequirePermissions(ManagerPermissions.OPS_VIEW)
  roomOversight(@Param('propertyId') propertyId: string, @Req() request: AppRequest) {
    return this.managerService.getRoomOversight(propertyId, request);
  }
}
