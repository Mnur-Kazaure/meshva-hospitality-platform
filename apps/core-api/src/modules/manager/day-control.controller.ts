import { Body, Controller, Param, Post, Req } from '@nestjs/common';
import { ManagerPermissions } from '@meshva/contracts';
import { IdempotentOperation } from '../../common/decorators/idempotent.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AppRequest } from '../../common/types/request-context';
import { UnlockDayDto } from './dto/unlock-day.dto';
import { ManagerService } from './manager.service';

@Controller('properties/:propertyId/day')
export class DayControlController {
  constructor(private readonly managerService: ManagerService) {}

  @Post('unlock')
  @RequirePermissions(ManagerPermissions.DAY_UNLOCK)
  @IdempotentOperation()
  unlock(
    @Param('propertyId') propertyId: string,
    @Req() request: AppRequest,
    @Body() dto: UnlockDayDto,
  ) {
    return this.managerService.unlockDay(propertyId, request, dto);
  }
}
