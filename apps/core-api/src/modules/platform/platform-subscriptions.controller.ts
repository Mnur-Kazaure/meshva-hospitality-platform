import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { PlatformAdminPermissions } from '@meshva/contracts';
import { IdempotentOperation } from '../../common/decorators/idempotent.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AppRequest } from '../../common/types/request-context';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import { PlatformService } from './platform.service';

@Controller('platform/subscription-plans')
export class PlatformSubscriptionsController {
  constructor(private readonly platformService: PlatformService) {}

  @Get()
  @RequirePermissions(PlatformAdminPermissions.SUBSCRIPTION_MANAGE)
  list() {
    return this.platformService.listSubscriptionPlans();
  }

  @Post()
  @RequirePermissions(PlatformAdminPermissions.SUBSCRIPTION_MANAGE)
  @IdempotentOperation()
  create(@Req() request: AppRequest, @Body() dto: CreateSubscriptionPlanDto) {
    return this.platformService.createSubscriptionPlan(request, dto);
  }

  @Patch(':planId')
  @RequirePermissions(PlatformAdminPermissions.SUBSCRIPTION_MANAGE)
  @IdempotentOperation()
  update(
    @Req() request: AppRequest,
    @Param('planId') planId: string,
    @Body() dto: UpdateSubscriptionPlanDto,
  ) {
    return this.platformService.updateSubscriptionPlan(request, planId, dto);
  }
}
