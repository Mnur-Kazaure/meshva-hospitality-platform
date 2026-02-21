import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { KitchenPermissions } from '@meshva/contracts';
import { IdempotentOperation } from '../../common/decorators/idempotent.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AppRequest } from '../../common/types/request-context';
import { CreateMenuCategoryDto } from './dto/create-menu-category.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { ListMenuItemsDto } from './dto/list-menu-items.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { KitchenService } from './kitchen.service';

@Controller('properties/:propertyId/kitchen/menu')
export class KitchenMenuController {
  constructor(private readonly kitchenService: KitchenService) {}

  @Get('categories')
  @RequirePermissions(KitchenPermissions.MENU_VIEW)
  listCategories(@Param('propertyId') propertyId: string, @Req() request: AppRequest) {
    return this.kitchenService.listMenuCategories(propertyId, request);
  }

  @Post('categories')
  @RequirePermissions(KitchenPermissions.MENU_MANAGE)
  @IdempotentOperation()
  createCategory(
    @Param('propertyId') propertyId: string,
    @Req() request: AppRequest,
    @Body() dto: CreateMenuCategoryDto,
  ) {
    return this.kitchenService.createMenuCategory(propertyId, request, dto);
  }

  @Get('items')
  @RequirePermissions(KitchenPermissions.MENU_VIEW)
  listItems(
    @Param('propertyId') propertyId: string,
    @Req() request: AppRequest,
    @Query() query: ListMenuItemsDto,
  ) {
    return this.kitchenService.listMenuItems(propertyId, request, query);
  }

  @Post('items')
  @RequirePermissions(KitchenPermissions.MENU_MANAGE)
  @IdempotentOperation()
  createItem(
    @Param('propertyId') propertyId: string,
    @Req() request: AppRequest,
    @Body() dto: CreateMenuItemDto,
  ) {
    return this.kitchenService.createMenuItem(propertyId, request, dto);
  }

  @Patch('items/:itemId')
  @RequirePermissions(KitchenPermissions.MENU_MANAGE)
  @IdempotentOperation()
  updateItem(
    @Param('propertyId') propertyId: string,
    @Param('itemId') itemId: string,
    @Req() request: AppRequest,
    @Body() dto: UpdateMenuItemDto,
  ) {
    return this.kitchenService.updateMenuItem(propertyId, request, itemId, dto);
  }
}

