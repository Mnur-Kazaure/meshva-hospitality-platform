import { Controller, Get, Param, Req } from '@nestjs/common';
import { KitchenPermissions } from '@meshva/contracts';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AppRequest } from '../../common/types/request-context';
import { KitchenService } from './kitchen.service';

@Controller('properties/:propertyId/kitchen/reports')
export class KitchenReportsController {
  constructor(private readonly kitchenService: KitchenService) {}

  @Get('lite')
  @RequirePermissions(KitchenPermissions.REPORTS_VIEW)
  getLiteReport(@Param('propertyId') propertyId: string, @Req() request: AppRequest) {
    return this.kitchenService.getLiteReport(propertyId, request);
  }
}

