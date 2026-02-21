import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { ManagerPermissions } from '@meshva/contracts';
import { IdempotentOperation } from '../../common/decorators/idempotent.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AppRequest } from '../../common/types/request-context';
import { CreateRatePlanDto } from './dto/create-rate-plan.dto';
import { UpdateRatePlanDto } from './dto/update-rate-plan.dto';
import { ManagerService } from './manager.service';

@Controller('properties/:propertyId/rate-plans')
export class RatePlansController {
  constructor(private readonly managerService: ManagerService) {}

  @Get()
  @RequirePermissions(ManagerPermissions.RATEPLAN_MANAGE)
  list(@Param('propertyId') propertyId: string, @Req() request: AppRequest) {
    return this.managerService.listRatePlans(propertyId, request);
  }

  @Post()
  @RequirePermissions(ManagerPermissions.RATEPLAN_MANAGE)
  @IdempotentOperation()
  create(
    @Param('propertyId') propertyId: string,
    @Req() request: AppRequest,
    @Body() dto: CreateRatePlanDto,
  ) {
    return this.managerService.createRatePlan(propertyId, request, dto);
  }

  @Patch(':ratePlanId')
  @RequirePermissions(ManagerPermissions.RATEPLAN_MANAGE)
  @IdempotentOperation()
  update(
    @Param('propertyId') propertyId: string,
    @Param('ratePlanId') ratePlanId: string,
    @Req() request: AppRequest,
    @Body() dto: UpdateRatePlanDto,
  ) {
    return this.managerService.updateRatePlan(propertyId, request, ratePlanId, dto);
  }
}
