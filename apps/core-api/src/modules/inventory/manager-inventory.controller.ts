import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ManagerPermissions } from '@meshva/contracts';
import { IdempotentOperation } from '../../common/decorators/idempotent.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AppRequest } from '../../common/types/request-context';
import { CreateInventoryBlockDto } from './dto/create-inventory-block.dto';
import { CreateInventoryOverrideDto } from './dto/create-inventory-override.dto';
import { ListInventoryCalendarDto } from './dto/list-inventory-calendar.dto';
import { InventoryService } from './inventory.service';

@Controller('properties/:propertyId/inventory')
export class ManagerInventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('calendar')
  @RequirePermissions(ManagerPermissions.INVENTORY_MANAGE)
  calendar(
    @Param('propertyId') propertyId: string,
    @Req() request: AppRequest,
    @Query() query: ListInventoryCalendarDto,
  ) {
    return this.inventoryService.getCalendar(propertyId, request, query);
  }

  @Post('blocks')
  @RequirePermissions(ManagerPermissions.INVENTORY_MANAGE)
  @IdempotentOperation()
  createBlock(
    @Param('propertyId') propertyId: string,
    @Req() request: AppRequest,
    @Body() dto: CreateInventoryBlockDto,
  ) {
    return this.inventoryService.createBlock(propertyId, request, dto);
  }

  @Post('overrides')
  @RequirePermissions(ManagerPermissions.INVENTORY_MANAGE)
  @IdempotentOperation()
  createOverride(
    @Param('propertyId') propertyId: string,
    @Req() request: AppRequest,
    @Body() dto: CreateInventoryOverrideDto,
  ) {
    return this.inventoryService.createOverride(propertyId, request, dto);
  }
}
