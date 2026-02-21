import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { PlatformAdminPermissions } from '@meshva/contracts';
import { IdempotentOperation } from '../../common/decorators/idempotent.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AppRequest } from '../../common/types/request-context';
import { AssignPlanDto } from './dto/assign-plan.dto';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { ImpersonateTenantDto } from './dto/impersonate-tenant.dto';
import { ListTenantsDto } from './dto/list-tenants.dto';
import { SuspendTenantDto } from './dto/suspend-tenant.dto';
import { UpsertFeatureFlagDto } from './dto/upsert-feature-flag.dto';
import { PlatformService } from './platform.service';

@Controller('platform/tenants')
export class PlatformTenantsController {
  constructor(private readonly platformService: PlatformService) {}

  @Get()
  @RequirePermissions(PlatformAdminPermissions.SYSTEM_VIEW)
  list(@Query() query: ListTenantsDto) {
    return this.platformService.listTenants(query);
  }

  @Get(':tenantId')
  @RequirePermissions(PlatformAdminPermissions.SYSTEM_VIEW)
  details(@Param('tenantId') tenantId: string) {
    return this.platformService.getTenantDetails(tenantId);
  }

  @Post()
  @RequirePermissions(PlatformAdminPermissions.TENANT_CREATE)
  @IdempotentOperation()
  create(@Req() request: AppRequest, @Body() dto: CreateTenantDto) {
    return this.platformService.createTenant(request, dto);
  }

  @Post(':tenantId/suspend')
  @RequirePermissions(PlatformAdminPermissions.TENANT_SUSPEND)
  @IdempotentOperation()
  suspend(
    @Param('tenantId') tenantId: string,
    @Req() request: AppRequest,
    @Body() dto: SuspendTenantDto,
  ) {
    return this.platformService.suspendTenant(tenantId, request, dto);
  }

  @Post(':tenantId/reactivate')
  @RequirePermissions(PlatformAdminPermissions.TENANT_SUSPEND)
  @IdempotentOperation()
  reactivate(@Param('tenantId') tenantId: string, @Req() request: AppRequest) {
    return this.platformService.reactivateTenant(tenantId, request);
  }

  @Post(':tenantId/assign-plan')
  @RequirePermissions(PlatformAdminPermissions.SUBSCRIPTION_MANAGE)
  @IdempotentOperation()
  assignPlan(
    @Param('tenantId') tenantId: string,
    @Req() request: AppRequest,
    @Body() dto: AssignPlanDto,
  ) {
    return this.platformService.assignPlanToTenant(tenantId, request, dto);
  }

  @Get(':tenantId/feature-flags')
  @RequirePermissions(PlatformAdminPermissions.FEATURE_FLAG_MANAGE)
  flags(@Param('tenantId') tenantId: string) {
    return this.platformService.listTenantFeatureFlags(tenantId);
  }

  @Post(':tenantId/feature-flags')
  @RequirePermissions(PlatformAdminPermissions.FEATURE_FLAG_MANAGE)
  @IdempotentOperation()
  upsertFlag(
    @Param('tenantId') tenantId: string,
    @Req() request: AppRequest,
    @Body() dto: UpsertFeatureFlagDto,
  ) {
    return this.platformService.upsertTenantFeatureFlag(tenantId, request, dto);
  }

  @Get(':tenantId/metrics')
  @RequirePermissions(PlatformAdminPermissions.SYSTEM_VIEW)
  metrics(@Param('tenantId') tenantId: string) {
    return this.platformService.getTenantMetrics(tenantId);
  }

  @Post(':tenantId/impersonate')
  @RequirePermissions(PlatformAdminPermissions.IMPERSONATE)
  @IdempotentOperation()
  impersonate(
    @Param('tenantId') tenantId: string,
    @Req() request: AppRequest,
    @Body() dto: ImpersonateTenantDto,
  ) {
    return this.platformService.startImpersonation(tenantId, request, dto);
  }
}
