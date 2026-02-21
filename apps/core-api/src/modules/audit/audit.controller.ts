import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { FrontDeskPermissions } from '@meshva/contracts';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AppRequest } from '../../common/types/request-context';
import { AuditService } from './audit.service';

class ListAuditLogsQueryDto {
  limit?: number;
}

@Controller('properties/:propertyId/audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @RequirePermissions(FrontDeskPermissions.RESERVATION_VIEW)
  list(
    @Param('propertyId') propertyId: string,
    @Query() query: ListAuditLogsQueryDto,
    @Req() request: AppRequest,
  ) {
    return this.auditService.listByProperty(
      request.context.tenantId,
      propertyId,
      Number(query.limit ?? 100),
    );
  }
}
