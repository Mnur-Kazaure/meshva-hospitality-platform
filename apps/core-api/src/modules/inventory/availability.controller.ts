import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { FrontDeskPermissions } from '@meshva/contracts';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AppRequest } from '../../common/types/request-context';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { InventoryService } from './inventory.service';

@Controller('properties/:propertyId/availability')
export class AvailabilityController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @RequirePermissions(FrontDeskPermissions.RESERVATION_VIEW)
  check(
    @Param('propertyId') propertyId: string,
    @Query() query: CheckAvailabilityDto,
    @Req() request: AppRequest,
  ) {
    return this.inventoryService.checkAvailability({
      tenantId: request.context.tenantId,
      propertyId,
      roomTypeId: query.roomTypeId,
      checkIn: query.checkIn,
      checkOut: query.checkOut,
    });
  }
}
