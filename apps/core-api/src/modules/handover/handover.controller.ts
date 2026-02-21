import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { FrontDeskPermissions, ShiftType } from '@meshva/contracts';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AppRequest } from '../../common/types/request-context';
import { CreateHandoverDto } from './dto/create-handover.dto';
import { HandoverService } from './handover.service';

class LatestHandoverQueryDto {
  shiftType?: ShiftType;
}

@Controller('properties/:propertyId/handover')
export class ShiftHandoverController {
  constructor(private readonly handoverService: HandoverService) {}

  @Post()
  @RequirePermissions(FrontDeskPermissions.SHIFT_HANDOVER_CREATE)
  create(
    @Param('propertyId') propertyId: string,
    @Req() request: AppRequest,
    @Body() dto: CreateHandoverDto,
  ) {
    return this.handoverService.create(propertyId, request, dto);
  }

  @Get('latest')
  @RequirePermissions(FrontDeskPermissions.SHIFT_HANDOVER_CREATE)
  latest(
    @Param('propertyId') propertyId: string,
    @Req() request: AppRequest,
    @Query() query: LatestHandoverQueryDto,
  ) {
    return this.handoverService.latest(
      propertyId,
      request.context.tenantId,
      request.context.userId,
      query.shiftType,
    );
  }
}
