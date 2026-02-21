import { Controller, Get, Query } from '@nestjs/common';
import { PlatformAdminPermissions } from '@meshva/contracts';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PlatformAuditQueryDto } from './dto/platform-audit-query.dto';
import { PlatformService } from './platform.service';

@Controller('platform')
export class PlatformSystemController {
  constructor(private readonly platformService: PlatformService) {}

  @Get('system/health')
  @RequirePermissions(PlatformAdminPermissions.SYSTEM_VIEW)
  health() {
    return this.platformService.getSystemHealth();
  }

  @Get('audit')
  @RequirePermissions(PlatformAdminPermissions.AUDIT_VIEW)
  audit(@Query() query: PlatformAuditQueryDto) {
    return this.platformService.listGlobalAudit(query);
  }
}
