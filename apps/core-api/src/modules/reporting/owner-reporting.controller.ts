import { Controller, Get, Query, Req } from '@nestjs/common';
import { OwnerPermissions } from '@meshva/contracts';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AppRequest } from '../../common/types/request-context';
import { OwnerDateRangeQueryDto } from './dto/owner-date-range-query.dto';
import { OwnerService } from './owner.service';

@Controller('owner')
export class OwnerReportingController {
  constructor(private readonly ownerService: OwnerService) {}

  @Get('overview')
  @RequirePermissions(OwnerPermissions.PORTFOLIO_VIEW)
  overview(@Req() request: AppRequest, @Query() query: OwnerDateRangeQueryDto) {
    return this.ownerService.getOverview(request, query);
  }

  @Get('properties')
  @RequirePermissions(OwnerPermissions.PROPERTY_VIEW)
  properties(@Req() request: AppRequest, @Query() query: OwnerDateRangeQueryDto) {
    return this.ownerService.getPropertiesComparison(request, query);
  }

  @Get('financial-summary')
  @RequirePermissions(OwnerPermissions.FINANCE_VIEW)
  financialSummary(@Req() request: AppRequest, @Query() query: OwnerDateRangeQueryDto) {
    return this.ownerService.getFinancialSummary(request, query);
  }

  @Get('operations-summary')
  @RequirePermissions(OwnerPermissions.OPERATIONS_VIEW)
  operationsSummary(@Req() request: AppRequest, @Query() query: OwnerDateRangeQueryDto) {
    return this.ownerService.getOperationsSummary(request, query);
  }
}
