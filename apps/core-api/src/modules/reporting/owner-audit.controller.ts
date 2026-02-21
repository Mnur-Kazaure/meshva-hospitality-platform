import { Controller, Get, Query, Req } from '@nestjs/common';
import { OwnerPermissions } from '@meshva/contracts';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AppRequest } from '../../common/types/request-context';
import { OwnerAuditQueryDto } from './dto/owner-audit-query.dto';
import { OwnerService } from './owner.service';

@Controller('owner/audit')
export class OwnerAuditController {
  constructor(private readonly ownerService: OwnerService) {}

  @Get()
  @RequirePermissions(OwnerPermissions.AUDIT_VIEW)
  list(@Req() request: AppRequest, @Query() query: OwnerAuditQueryDto) {
    return this.ownerService.listAudit(request, query);
  }
}
