import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FolioLineType,
  KitchenEvents,
  KitchenOrderStatuses,
  StayStatus,
} from '@meshva/contracts';
import { randomUUID } from 'crypto';
import { AppRequest } from '../../common/types/request-context';
import { AuditService } from '../audit/audit.service';
import { KitchenOrderRecord } from '../tenancy/tenancy-store.service';
import {
  FRONT_DESK_REPOSITORY,
  FrontDeskRepository,
} from '../persistence/repositories/front-desk.repository';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { ChangeOrderStatusDto } from './dto/change-order-status.dto';
import {
  CreateKitchenOrderDto,
  CreateKitchenOrderItemDto,
} from './dto/create-kitchen-order.dto';
import { CreateMenuCategoryDto } from './dto/create-menu-category.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { ListKitchenOrdersDto } from './dto/list-kitchen-orders.dto';
import { ListMenuItemsDto } from './dto/list-menu-items.dto';
import { PostKitchenChargeDto } from './dto/post-kitchen-charge.dto';
import { UpdateKitchenOrderDto } from './dto/update-kitchen-order.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

type KitchenOrderStatus = (typeof KitchenOrderStatuses)[keyof typeof KitchenOrderStatuses];

export interface KitchenOrderResponse {
  id: string;
  code: string;
  stayId: string;
  roomLabel: string;
  guestLabel: string;
  status: KitchenOrderStatus;
  notes?: string;
  items: Array<{
    id: string;
    menuItemId: string;
    menuItemName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    itemNote?: string;
  }>;
  totalAmount: number;
  chargePostedAt: string | null;
  cancelledReason?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class KitchenService {
  private readonly statusTransitions: Record<KitchenOrderStatus, KitchenOrderStatus[]> = {
    [KitchenOrderStatuses.NEW]: [KitchenOrderStatuses.ACCEPTED],
    [KitchenOrderStatuses.ACCEPTED]: [KitchenOrderStatuses.IN_PREP],
    [KitchenOrderStatuses.IN_PREP]: [KitchenOrderStatuses.READY],
    [KitchenOrderStatuses.READY]: [KitchenOrderStatuses.DELIVERED],
    [KitchenOrderStatuses.DELIVERED]: [],
    [KitchenOrderStatuses.CANCELLED]: [],
    [KitchenOrderStatuses.CANCELLED_WITH_REASON]: [],
  };

  constructor(
    @Inject(FRONT_DESK_REPOSITORY)
    private readonly repository: FrontDeskRepository,
    private readonly auditService: AuditService,
  ) {}

  async listMenuCategories(propertyId: string, request: AppRequest) {
    const categories = await this.repository.listMenuCategories({
      tenantId: request.context.tenantId,
      propertyId,
    });

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
    }));
  }

  async createMenuCategory(
    propertyId: string,
    request: AppRequest,
    dto: CreateMenuCategoryDto,
  ) {
    const now = new Date().toISOString();
    const category = await this.repository.createMenuCategory({
      category: {
        id: randomUUID(),
        tenantId: request.context.tenantId,
        propertyId,
        name: dto.name.trim(),
        createdByUserId: request.context.userId,
        updatedByUserId: request.context.userId,
        createdAt: now,
        updatedAt: now,
      },
    });

    await this.auditService.recordMutation(request.context, {
      action: KitchenEvents.MENU_CATEGORY_CREATED,
      entityType: 'MenuCategory',
      entityId: category.id,
      propertyId,
      afterJson: category,
    });

    return {
      id: category.id,
      name: category.name,
    };
  }

  async listMenuItems(
    propertyId: string,
    request: AppRequest,
    query: ListMenuItemsDto,
  ) {
    const items = await this.repository.listMenuItems({
      tenantId: request.context.tenantId,
      propertyId,
      categoryId: query.categoryId,
    });

    return items.map((item) => ({
      id: item.id,
      categoryId: item.categoryId,
      name: item.name,
      price: item.price,
      active: item.active,
      description: item.description,
    }));
  }

  async createMenuItem(propertyId: string, request: AppRequest, dto: CreateMenuItemDto) {
    const category = await this.repository.getMenuCategory({
      tenantId: request.context.tenantId,
      propertyId,
      categoryId: dto.categoryId,
    });
    if (!category) {
      throw new NotFoundException('Menu category not found');
    }

    const now = new Date().toISOString();
    const item = await this.repository.createMenuItem({
      item: {
        id: randomUUID(),
        tenantId: request.context.tenantId,
        propertyId,
        categoryId: dto.categoryId,
        name: dto.name.trim(),
        price: this.roundCurrency(dto.price),
        active: dto.active ?? true,
        description: dto.description?.trim(),
        createdByUserId: request.context.userId,
        updatedByUserId: request.context.userId,
        createdAt: now,
        updatedAt: now,
      },
    });

    await this.auditService.recordMutation(request.context, {
      action: KitchenEvents.MENU_ITEM_CREATED,
      entityType: 'MenuItem',
      entityId: item.id,
      propertyId,
      afterJson: item,
    });

    return {
      id: item.id,
      categoryId: item.categoryId,
      name: item.name,
      price: item.price,
      active: item.active,
      description: item.description,
    };
  }

  async updateMenuItem(
    propertyId: string,
    request: AppRequest,
    itemId: string,
    dto: UpdateMenuItemDto,
  ) {
    if (
      dto.categoryId === undefined &&
      dto.name === undefined &&
      dto.price === undefined &&
      dto.active === undefined &&
      dto.description === undefined
    ) {
      throw new BadRequestException('At least one menu item field must be provided');
    }

    const tenantId = request.context.tenantId;
    const item = await this.repository.getMenuItem({
      tenantId,
      propertyId,
      itemId,
    });
    if (!item) {
      throw new NotFoundException('Menu item not found');
    }

    if (dto.categoryId) {
      const category = await this.repository.getMenuCategory({
        tenantId,
        propertyId,
        categoryId: dto.categoryId,
      });
      if (!category) {
        throw new NotFoundException('Target menu category not found');
      }
    }

    const now = new Date().toISOString();
    const before = { ...item };
    const updated = await this.repository.updateMenuItem({
      item: {
        ...item,
        categoryId: dto.categoryId ?? item.categoryId,
        name: dto.name?.trim() ?? item.name,
        price: dto.price === undefined ? item.price : this.roundCurrency(dto.price),
        active: dto.active ?? item.active,
        description:
          dto.description === undefined ? item.description : dto.description.trim() || undefined,
        updatedByUserId: request.context.userId,
        updatedAt: now,
      },
    });

    await this.auditService.recordMutation(request.context, {
      action: KitchenEvents.MENU_ITEM_UPDATED,
      entityType: 'MenuItem',
      entityId: updated.id,
      propertyId,
      beforeJson: before,
      afterJson: updated,
    });

    return {
      id: updated.id,
      categoryId: updated.categoryId,
      name: updated.name,
      price: updated.price,
      active: updated.active,
      description: updated.description,
    };
  }

  async listOrders(propertyId: string, request: AppRequest, query: ListKitchenOrdersDto) {
    const orders = await this.repository.listKitchenOrders({
      tenantId: request.context.tenantId,
      propertyId,
      status: query.status,
      from: query.from,
      to: query.to,
      search: query.q,
    });

    return this.buildOrderResponses(request.context.tenantId, propertyId, orders);
  }

  async createOrder(
    propertyId: string,
    request: AppRequest,
    dto: CreateKitchenOrderDto,
  ): Promise<KitchenOrderResponse> {
    const tenantId = request.context.tenantId;
    const stay = await this.repository.getStay({
      tenantId,
      propertyId,
      stayId: dto.stayId,
    });
    if (!stay) {
      throw new NotFoundException('Stay not found');
    }
    if (stay.status !== StayStatus.OPEN) {
      throw new BadRequestException('Room service orders require an OPEN stay');
    }
    if (!stay.roomId) {
      throw new BadRequestException('Stay must have an assigned room before creating kitchen orders');
    }

    const room = await this.repository.getRoom({
      tenantId,
      propertyId,
      roomId: stay.roomId,
    });
    if (!room) {
      throw new NotFoundException('Assigned room not found for stay');
    }

    const now = new Date().toISOString();
    const orderId = randomUUID();
    const code = await this.repository.generateKitchenOrderCode(propertyId);
    const itemBuild = await this.buildOrderItems(
      tenantId,
      propertyId,
      orderId,
      dto.items,
      now,
    );

    const order = await this.repository.createKitchenOrder({
      order: {
        id: orderId,
        tenantId,
        propertyId,
        code,
        stayId: stay.id,
        roomId: room.id,
        status: KitchenOrderStatuses.NEW,
        notes: dto.notes?.trim() || undefined,
        totalAmount: itemBuild.totalAmount,
        createdByUserId: request.context.userId,
        updatedByUserId: request.context.userId,
        createdAt: now,
        updatedAt: now,
      },
    });

    const createdItems = await this.repository.createKitchenOrderItems({
      tenantId,
      propertyId,
      items: itemBuild.items,
    });

    await this.auditService.recordMutation(request.context, {
      action: KitchenEvents.ORDER_CREATED,
      entityType: 'KitchenOrder',
      entityId: order.id,
      propertyId,
      afterJson: {
        ...order,
        items: createdItems,
      },
    });

    return this.buildOrderResponse(tenantId, propertyId, order);
  }

  async updateOrder(
    propertyId: string,
    request: AppRequest,
    orderId: string,
    dto: UpdateKitchenOrderDto,
  ): Promise<KitchenOrderResponse> {
    if (dto.notes === undefined && dto.items === undefined) {
      throw new BadRequestException('Provide notes or items to update');
    }

    const tenantId = request.context.tenantId;
    const order = await this.getOrderOrThrow(tenantId, propertyId, orderId);
    if (
      order.status !== KitchenOrderStatuses.NEW &&
      order.status !== KitchenOrderStatuses.ACCEPTED
    ) {
      throw new BadRequestException('Order updates are only allowed while status is NEW or ACCEPTED');
    }

    const beforeOrder = { ...order };
    const existingItems = await this.repository.listKitchenOrderItems({
      tenantId,
      propertyId,
      orderId,
    });

    const now = new Date().toISOString();
    let nextTotalAmount = order.totalAmount;

    if (dto.items) {
      const itemBuild = await this.buildOrderItems(
        tenantId,
        propertyId,
        order.id,
        dto.items,
        now,
      );
      await this.repository.deleteKitchenOrderItems({ tenantId, propertyId, orderId: order.id });
      await this.repository.createKitchenOrderItems({
        tenantId,
        propertyId,
        items: itemBuild.items,
      });
      nextTotalAmount = itemBuild.totalAmount;
    }

    const updatedOrder = await this.repository.updateKitchenOrder({
      order: {
        ...order,
        notes: dto.notes === undefined ? order.notes : dto.notes.trim() || undefined,
        totalAmount: nextTotalAmount,
        updatedByUserId: request.context.userId,
        updatedAt: now,
      },
    });

    const updatedItems = await this.repository.listKitchenOrderItems({
      tenantId,
      propertyId,
      orderId: order.id,
    });

    await this.auditService.recordMutation(request.context, {
      action: KitchenEvents.ORDER_UPDATED,
      entityType: 'KitchenOrder',
      entityId: updatedOrder.id,
      propertyId,
      beforeJson: {
        ...beforeOrder,
        items: existingItems,
      },
      afterJson: {
        ...updatedOrder,
        items: updatedItems,
      },
    });

    return this.buildOrderResponse(tenantId, propertyId, updatedOrder);
  }

  async changeOrderStatus(
    propertyId: string,
    request: AppRequest,
    orderId: string,
    dto: ChangeOrderStatusDto,
  ): Promise<KitchenOrderResponse> {
    const tenantId = request.context.tenantId;
    const order = await this.getOrderOrThrow(tenantId, propertyId, orderId);

    this.assertTransitionAllowed(order.status, dto.toStatus);

    const now = new Date().toISOString();
    const before = { ...order };
    const updated = await this.repository.updateKitchenOrder({
      order: {
        ...order,
        status: dto.toStatus,
        updatedByUserId: request.context.userId,
        updatedAt: now,
      },
    });

    await this.auditService.recordMutation(request.context, {
      action: KitchenEvents.ORDER_STATUS_CHANGED,
      entityType: 'KitchenOrder',
      entityId: updated.id,
      propertyId,
      beforeJson: before,
      afterJson: updated,
    });

    return this.buildOrderResponse(tenantId, propertyId, updated);
  }

  async cancelOrder(
    propertyId: string,
    request: AppRequest,
    orderId: string,
    dto: CancelOrderDto,
  ): Promise<KitchenOrderResponse> {
    return this.cancelOrderInternal(propertyId, request, orderId, dto, false);
  }

  async cancelOrderWithOverride(
    propertyId: string,
    request: AppRequest,
    orderId: string,
    dto: CancelOrderDto,
  ): Promise<KitchenOrderResponse> {
    return this.cancelOrderInternal(propertyId, request, orderId, dto, true);
  }

  async postCharge(
    propertyId: string,
    request: AppRequest,
    orderId: string,
    dto: PostKitchenChargeDto,
  ): Promise<KitchenOrderResponse> {
    const tenantId = request.context.tenantId;
    const order = await this.getOrderOrThrow(tenantId, propertyId, orderId);

    if (order.status !== KitchenOrderStatuses.DELIVERED) {
      throw new BadRequestException('Only DELIVERED orders can be posted to folio');
    }

    if (order.chargeFolioLineItemId) {
      return this.buildOrderResponse(tenantId, propertyId, order);
    }

    const stay = await this.repository.getStay({
      tenantId,
      propertyId,
      stayId: order.stayId,
    });
    if (!stay || stay.status !== StayStatus.OPEN) {
      throw new BadRequestException('Charge posting requires an OPEN stay');
    }

    const invoice = await this.repository.getOpenInvoiceByStay({
      tenantId,
      propertyId,
      stayId: stay.id,
    });
    if (!invoice) {
      throw new BadRequestException('No open invoice available for this stay');
    }

    const now = new Date().toISOString();
    const descriptionSuffix = dto.note?.trim() ? ` - ${dto.note.trim()}` : '';
    const lineItem = await this.repository.createFolioLineItem({
      lineItem: {
        id: randomUUID(),
        tenantId,
        propertyId,
        invoiceId: invoice.id,
        referenceOrderId: order.id,
        entityType: 'STAY',
        entityId: stay.id,
        lineType: FolioLineType.KITCHEN_CHARGE,
        amount: this.roundCurrency(order.totalAmount),
        currency: invoice.currency,
        description: `Kitchen Order #${order.code}${descriptionSuffix}`,
        createdByUserId: request.context.userId,
        createdAt: now,
      },
    });

    const updatedOrder = await this.repository.updateKitchenOrder({
      order: {
        ...order,
        chargePostedAt: now,
        chargeFolioLineItemId: lineItem.id,
        updatedByUserId: request.context.userId,
        updatedAt: now,
      },
    });

    await this.auditService.recordMutation(request.context, {
      action: KitchenEvents.FOLIO_CHARGE_POSTED,
      entityType: 'FolioLineItem',
      entityId: lineItem.id,
      propertyId,
      afterJson: {
        ...lineItem,
        orderId: order.id,
      },
    });

    await this.repository.enqueue('messaging', 'messaging.send', {
      tenantId,
      propertyId,
      type: 'KITCHEN_CHARGE_POSTED',
      orderId: order.id,
      invoiceId: invoice.id,
    });

    return this.buildOrderResponse(tenantId, propertyId, updatedOrder);
  }

  async getLiteReport(propertyId: string, request: AppRequest) {
    const tenantId = request.context.tenantId;
    const orders = await this.repository.listKitchenOrders({
      tenantId,
      propertyId,
    });

    const deliveredOrders = orders.filter((order) => order.status === KitchenOrderStatuses.DELIVERED);
    const cancelledOrders = orders.filter(
      (order) =>
        order.status === KitchenOrderStatuses.CANCELLED ||
        order.status === KitchenOrderStatuses.CANCELLED_WITH_REASON,
    );

    const averagePrepMinutes =
      deliveredOrders.length === 0
        ? 0
        : Math.round(
            deliveredOrders.reduce((sum, order) => {
              const minutes =
                (new Date(order.updatedAt).getTime() - new Date(order.createdAt).getTime()) /
                60000;
              return sum + Math.max(0, minutes);
            }, 0) / deliveredOrders.length,
          );

    const deliveredItems = await Promise.all(
      deliveredOrders.map((order) =>
        this.repository.listKitchenOrderItems({
          tenantId,
          propertyId,
          orderId: order.id,
        }),
      ),
    );

    const itemCounts = new Map<string, number>();
    for (const items of deliveredItems) {
      for (const item of items) {
        itemCounts.set(item.menuItemName, (itemCounts.get(item.menuItemName) ?? 0) + item.quantity);
      }
    }

    const topItems = [...itemCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return {
      totalOrders: orders.length,
      deliveredOrders: deliveredOrders.length,
      cancelledOrders: cancelledOrders.length,
      averagePrepMinutes,
      topItems,
    };
  }

  private async cancelOrderInternal(
    propertyId: string,
    request: AppRequest,
    orderId: string,
    dto: CancelOrderDto,
    override: boolean,
  ): Promise<KitchenOrderResponse> {
    const tenantId = request.context.tenantId;
    const order = await this.getOrderOrThrow(tenantId, propertyId, orderId);

    if (order.status === KitchenOrderStatuses.DELIVERED) {
      throw new BadRequestException('Delivered orders cannot be cancelled');
    }

    if (override) {
      if (
        order.status !== KitchenOrderStatuses.IN_PREP &&
        order.status !== KitchenOrderStatuses.READY
      ) {
        throw new BadRequestException(
          'Override cancellation is only allowed when order is IN_PREP or READY',
        );
      }
    } else if (
      order.status !== KitchenOrderStatuses.NEW &&
      order.status !== KitchenOrderStatuses.ACCEPTED
    ) {
      throw new BadRequestException('Kitchen cancellation is only allowed for NEW or ACCEPTED');
    }

    const now = new Date().toISOString();
    const before = { ...order };
    const updated = await this.repository.updateKitchenOrder({
      order: {
        ...order,
        status: override ? KitchenOrderStatuses.CANCELLED_WITH_REASON : KitchenOrderStatuses.CANCELLED,
        cancelledReason: dto.reason.trim(),
        updatedByUserId: request.context.userId,
        updatedAt: now,
      },
    });

    await this.auditService.recordMutation(request.context, {
      action: override
        ? KitchenEvents.ORDER_CANCELLED_WITH_OVERRIDE
        : KitchenEvents.ORDER_CANCELLED,
      entityType: 'KitchenOrder',
      entityId: updated.id,
      propertyId,
      beforeJson: before,
      afterJson: updated,
    });

    return this.buildOrderResponse(tenantId, propertyId, updated);
  }

  private async getOrderOrThrow(
    tenantId: string,
    propertyId: string,
    orderId: string,
  ) {
    const order = await this.repository.getKitchenOrder({ tenantId, propertyId, orderId });
    if (!order) {
      throw new NotFoundException('Kitchen order not found');
    }
    return order;
  }

  private assertTransitionAllowed(from: KitchenOrderStatus, to: KitchenOrderStatus) {
    if (!this.statusTransitions[from]?.includes(to)) {
      throw new BadRequestException(`Invalid kitchen order transition from ${from} to ${to}`);
    }
  }

  private async buildOrderItems(
    tenantId: string,
    propertyId: string,
    orderId: string,
    requestedItems: CreateKitchenOrderItemDto[],
    now: string,
  ) {
    const uniqueMenuItemIds = [...new Set(requestedItems.map((item) => item.menuItemId))];
    const menuItems = await Promise.all(
      uniqueMenuItemIds.map((itemId) =>
        this.repository.getMenuItem({
          tenantId,
          propertyId,
          itemId,
        }),
      ),
    );

    const menuItemMap = new Map<string, NonNullable<(typeof menuItems)[number]>>();
    for (const menuItem of menuItems) {
      if (!menuItem) {
        continue;
      }
      menuItemMap.set(menuItem.id, menuItem);
    }

    const items = requestedItems.map((item) => {
      const menuItem = menuItemMap.get(item.menuItemId);
      if (!menuItem) {
        throw new NotFoundException(`Menu item ${item.menuItemId} was not found`);
      }
      if (!menuItem.active) {
        throw new BadRequestException(`Menu item ${menuItem.name} is inactive and cannot be ordered`);
      }

      const lineTotal = this.roundCurrency(menuItem.price * item.quantity);
      return {
        id: randomUUID(),
        tenantId,
        propertyId,
        orderId,
        menuItemId: menuItem.id,
        menuItemName: menuItem.name,
        quantity: item.quantity,
        unitPrice: menuItem.price,
        lineTotal,
        itemNote: item.itemNote?.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      };
    });

    return {
      items,
      totalAmount: this.roundCurrency(items.reduce((sum, item) => sum + item.lineTotal, 0)),
    };
  }

  private async buildOrderResponse(
    tenantId: string,
    propertyId: string,
    order: KitchenOrderRecord,
  ): Promise<KitchenOrderResponse> {
    const [response] = await this.buildOrderResponses(tenantId, propertyId, [order]);
    return response;
  }

  private async buildOrderResponses(
    tenantId: string,
    propertyId: string,
    orders: KitchenOrderRecord[],
  ): Promise<KitchenOrderResponse[]> {
    if (orders.length === 0) {
      return [];
    }

    const [stays, rooms, guests, orderItemsCollections] = await Promise.all([
      this.repository.listStays({ tenantId, propertyId }),
      this.repository.listRooms({ tenantId, propertyId }),
      this.repository.searchGuests({ tenantId, propertyId }),
      Promise.all(
        orders.map((order) =>
          this.repository.listKitchenOrderItems({
            tenantId,
            propertyId,
            orderId: order.id,
          }),
        ),
      ),
    ]);

    const staysById = new Map(stays.map((stay) => [stay.id, stay]));
    const roomsById = new Map(rooms.map((room) => [room.id, room]));
    const guestsById = new Map(guests.map((guest) => [guest.id, guest]));
    const itemsByOrderId = new Map(
      orders.map((order, index) => [order.id, orderItemsCollections[index]]),
    );

    return orders.map((order) => {
      const stay = staysById.get(order.stayId);
      const room = roomsById.get(order.roomId) ?? (stay?.roomId ? roomsById.get(stay.roomId) : undefined);
      const guest = stay ? guestsById.get(stay.guestId) : undefined;
      const items = itemsByOrderId.get(order.id) ?? [];

      return {
        id: order.id,
        code: order.code,
        stayId: order.stayId,
        roomLabel: room ? `Room ${room.roomNumber}` : order.roomId,
        guestLabel: guest?.fullName ?? 'Guest',
        status: order.status,
        notes: order.notes,
        items: items.map((item) => ({
          id: item.id,
          menuItemId: item.menuItemId,
          menuItemName: item.menuItemName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
          itemNote: item.itemNote,
        })),
        totalAmount: order.totalAmount,
        chargePostedAt: order.chargePostedAt ?? null,
        cancelledReason: order.cancelledReason,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      };
    });
  }

  private roundCurrency(amount: number): number {
    return Number(amount.toFixed(2));
  }
}
