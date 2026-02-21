import { Body, Controller, Param, Post, Req } from '@nestjs/common';
import { PlatformAdminPermissions } from '@meshva/contracts';
import { IdempotentOperation } from '../../common/decorators/idempotent.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AppRequest } from '../../common/types/request-context';
import { EndImpersonationDto } from './dto/end-impersonation.dto';
import { ResetUserPasswordDto } from './dto/reset-user-password.dto';
import { PlatformService } from './platform.service';

@Controller('platform')
export class PlatformSupportController {
  constructor(private readonly platformService: PlatformService) {}

  @Post('impersonations/:sessionId/end')
  @RequirePermissions(PlatformAdminPermissions.IMPERSONATE)
  @IdempotentOperation()
  endImpersonation(
    @Req() request: AppRequest,
    @Param('sessionId') sessionId: string,
    @Body() dto: EndImpersonationDto,
  ) {
    return this.platformService.endImpersonation(request, sessionId, dto);
  }

  @Post('users/:userId/reset-password')
  @RequirePermissions(PlatformAdminPermissions.USER_RESET)
  @IdempotentOperation()
  resetPassword(
    @Req() request: AppRequest,
    @Param('userId') userId: string,
    @Body() dto: ResetUserPasswordDto,
  ) {
    return this.platformService.resetUserPassword(request, userId, dto);
  }
}
