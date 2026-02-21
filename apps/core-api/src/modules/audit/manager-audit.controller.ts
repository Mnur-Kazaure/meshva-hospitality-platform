import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { ManagerPermissions } from '@meshva/contracts';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AppRequest } from '../../common/types/request-context';
import { AuditService } from './audit.service';

class ManagerAuditQueryDto {
  from?: string;
  to?: string;
  actorUserId?: string;
  entityType?: string;
  limit?: number;
}

@Controller('properties/:propertyId/audit')
export class ManagerAuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @RequirePermissions(ManagerPermissions.STAFF_ACTIVITY_VIEW)
  list(
    @Param('propertyId') propertyId: string,
    @Query() query: ManagerAuditQueryDto,
    @Req() request: AppRequest,
  ) {
    return this.auditService.listByPropertyWithFilters({
      tenantId: request.context.tenantId,
      propertyId,
      from: query.from,
      to: query.to,
      actorUserId: query.actorUserId,
      entityType: query.entityType,
      limit: query.limit ? Number(query.limit) : 100,
    });
  }
}
