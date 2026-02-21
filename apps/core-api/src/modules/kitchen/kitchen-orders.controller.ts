import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { KitchenPermissions, ManagerPermissions } from '@meshva/contracts';
import { IdempotentOperation } from '../../common/decorators/idempotent.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AppRequest } from '../../common/types/request-context';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { ChangeOrderStatusDto } from './dto/change-order-status.dto';
import { CreateKitchenOrderDto } from './dto/create-kitchen-order.dto';
import { ListKitchenOrdersDto } from './dto/list-kitchen-orders.dto';
import { PostKitchenChargeDto } from './dto/post-kitchen-charge.dto';
import { UpdateKitchenOrderDto } from './dto/update-kitchen-order.dto';
import { KitchenService } from './kitchen.service';

@Controller('properties/:propertyId/kitchen/orders')
export class KitchenOrdersController {
  constructor(private readonly kitchenService: KitchenService) {}

  @Get()
  @RequirePermissions(KitchenPermissions.ORDER_VIEW)
  listOrders(
    @Param('propertyId') propertyId: string,
    @Req() request: AppRequest,
    @Query() query: ListKitchenOrdersDto,
  ) {
    return this.kitchenService.listOrders(propertyId, request, query);
  }

  @Post()
  @RequirePermissions(KitchenPermissions.ORDER_CREATE)
  @IdempotentOperation()
  createOrder(
    @Param('propertyId') propertyId: string,
    @Req() request: AppRequest,
    @Body() dto: CreateKitchenOrderDto,
  ) {
    return this.kitchenService.createOrder(propertyId, request, dto);
  }

  @Patch(':orderId')
  @RequirePermissions(KitchenPermissions.ORDER_MODIFY)
  @IdempotentOperation()
  updateOrder(
    @Param('propertyId') propertyId: string,
    @Param('orderId') orderId: string,
    @Req() request: AppRequest,
    @Body() dto: UpdateKitchenOrderDto,
  ) {
    return this.kitchenService.updateOrder(propertyId, request, orderId, dto);
  }

  @Post(':orderId/status')
  @RequirePermissions(KitchenPermissions.ORDER_UPDATE_STATUS)
  @IdempotentOperation()
  changeOrderStatus(
    @Param('propertyId') propertyId: string,
    @Param('orderId') orderId: string,
    @Req() request: AppRequest,
    @Body() dto: ChangeOrderStatusDto,
  ) {
    return this.kitchenService.changeOrderStatus(propertyId, request, orderId, dto);
  }

  @Post(':orderId/cancel')
  @RequirePermissions(KitchenPermissions.ORDER_CANCEL)
  @IdempotentOperation()
  cancelOrder(
    @Param('propertyId') propertyId: string,
    @Param('orderId') orderId: string,
    @Req() request: AppRequest,
    @Body() dto: CancelOrderDto,
  ) {
    return this.kitchenService.cancelOrder(propertyId, request, orderId, dto);
  }

  @Post(':orderId/cancel-override')
  @RequirePermissions(ManagerPermissions.KITCHEN_CANCEL_OVERRIDE)
  @IdempotentOperation()
  cancelOrderWithOverride(
    @Param('propertyId') propertyId: string,
    @Param('orderId') orderId: string,
    @Req() request: AppRequest,
    @Body() dto: CancelOrderDto,
  ) {
    return this.kitchenService.cancelOrderWithOverride(propertyId, request, orderId, dto);
  }

  @Post(':orderId/post-charge')
  @RequirePermissions(KitchenPermissions.CHARGE_POST)
  @IdempotentOperation()
  postCharge(
    @Param('propertyId') propertyId: string,
    @Param('orderId') orderId: string,
    @Req() request: AppRequest,
    @Body() dto: PostKitchenChargeDto,
  ) {
    return this.kitchenService.postCharge(propertyId, request, orderId, dto);
  }
}

