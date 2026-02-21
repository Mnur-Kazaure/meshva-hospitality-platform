import type {
  CancelOrderDto,
  ChangeOrderStatusDto,
  CreateKitchenOrderDto,
  CreateMenuCategoryDto,
  CreateMenuItemDto,
  KitchenOrderStatus,
  PostKitchenChargeDto,
  UpdateKitchenOrderDto,
  UpdateMenuItemDto,
} from '../../types/contracts';
import { KitchenOrderStatuses } from '../../types/contracts';
import type { KitchenOrder } from '../../../entities/kitchen-order/model/types';
import type { KitchenReport } from '../../../entities/kitchen-report/model/types';
import type { MenuCategory, MenuItem } from '../../../entities/menu/model/types';

const seedCategories: MenuCategory[] = [
  { id: 'cat-main', name: 'Main Meals' },
  { id: 'cat-drink', name: 'Drinks' },
  { id: 'cat-dessert', name: 'Desserts' },
];

const seedItems: MenuItem[] = [
  { id: 'item-jollof', categoryId: 'cat-main', name: 'Jollof Rice + Chicken', price: 8500, active: true },
  { id: 'item-suya', categoryId: 'cat-main', name: 'Beef Suya Plate', price: 7200, active: true },
  { id: 'item-water', categoryId: 'cat-drink', name: 'Bottled Water', price: 800, active: true },
  { id: 'item-juice', categoryId: 'cat-drink', name: 'Fresh Orange Juice', price: 2500, active: true },
  { id: 'item-cake', categoryId: 'cat-dessert', name: 'Chocolate Cake Slice', price: 2200, active: true },
];

const now = new Date();

const seedOrders: KitchenOrder[] = [
  {
    id: 'ord-1001',
    code: 'K-1001',
    stayId: 'stay-4401',
    roomLabel: 'Room 204',
    guestLabel: 'A. Ibrahim',
    status: KitchenOrderStatuses.NEW,
    notes: 'No pepper, guest allergic to nuts',
    items: [
      { id: 'oi-1', menuItemId: 'item-jollof', menuItemName: 'Jollof Rice + Chicken', quantity: 1, unitPrice: 8500, lineTotal: 8500 },
      { id: 'oi-2', menuItemId: 'item-water', menuItemName: 'Bottled Water', quantity: 2, unitPrice: 800, lineTotal: 1600 },
    ],
    totalAmount: 10100,
    chargePostedAt: null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  },
  {
    id: 'ord-1002',
    code: 'K-1002',
    stayId: 'stay-4402',
    roomLabel: 'Room 118',
    guestLabel: 'F. Musa',
    status: KitchenOrderStatuses.IN_PREP,
    notes: 'Extra spice',
    items: [{ id: 'oi-3', menuItemId: 'item-suya', menuItemName: 'Beef Suya Plate', quantity: 1, unitPrice: 7200, lineTotal: 7200 }],
    totalAmount: 7200,
    chargePostedAt: null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  },
  {
    id: 'ord-1003',
    code: 'K-1003',
    stayId: 'stay-4403',
    roomLabel: 'Room 301',
    guestLabel: 'R. Abdullahi',
    status: KitchenOrderStatuses.DELIVERED,
    items: [{ id: 'oi-4', menuItemId: 'item-juice', menuItemName: 'Fresh Orange Juice', quantity: 2, unitPrice: 2500, lineTotal: 5000 }],
    totalAmount: 5000,
    chargePostedAt: null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  },
];

let categories: MenuCategory[] = [...seedCategories];
let items: MenuItem[] = [...seedItems];
let orders: KitchenOrder[] = [...seedOrders];

function findOrderOrThrow(orderId: string): KitchenOrder {
  const order = orders.find((entry) => entry.id === orderId);
  if (!order) {
    throw new Error('Order not found');
  }
  return order;
}

function validateTransition(fromStatus: KitchenOrderStatus, toStatus: KitchenOrderStatus): void {
  const allowed: Record<KitchenOrderStatus, KitchenOrderStatus[]> = {
    NEW: [KitchenOrderStatuses.ACCEPTED, KitchenOrderStatuses.CANCELLED],
    ACCEPTED: [KitchenOrderStatuses.IN_PREP, KitchenOrderStatuses.CANCELLED],
    IN_PREP: [KitchenOrderStatuses.READY],
    READY: [KitchenOrderStatuses.DELIVERED],
    DELIVERED: [],
    CANCELLED: [],
    CANCELLED_WITH_REASON: [],
  };

  if (!allowed[fromStatus].includes(toStatus)) {
    throw new Error(`Invalid transition from ${fromStatus} to ${toStatus}`);
  }
}

function computeReport(): KitchenReport {
  const delivered = orders.filter((order) => order.status === KitchenOrderStatuses.DELIVERED).length;
  const cancelled = orders.filter(
    (order) => order.status === KitchenOrderStatuses.CANCELLED || order.status === KitchenOrderStatuses.CANCELLED_WITH_REASON,
  ).length;

  const orderItemCounts = new Map<string, number>();
  for (const order of orders) {
    for (const item of order.items) {
      orderItemCounts.set(item.menuItemName, (orderItemCounts.get(item.menuItemName) ?? 0) + item.quantity);
    }
  }

  const topItems = [...orderItemCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  return {
    totalOrders: orders.length,
    deliveredOrders: delivered,
    cancelledOrders: cancelled,
    averagePrepMinutes: 18,
    topItems,
  };
}

export const kitchenStore = {
  listMenuCategories(): MenuCategory[] {
    return categories;
  },
  createMenuCategory(input: CreateMenuCategoryDto): MenuCategory {
    const category: MenuCategory = {
      id: `cat-${Date.now()}`,
      name: input.name,
    };
    categories = [category, ...categories];
    return category;
  },
  listMenuItems(): MenuItem[] {
    return items;
  },
  createMenuItem(input: CreateMenuItemDto): MenuItem {
    const menuItem: MenuItem = {
      id: `item-${Date.now()}`,
      categoryId: input.categoryId,
      name: input.name,
      price: input.price,
      active: input.active ?? true,
      description: input.description,
    };
    items = [menuItem, ...items];
    return menuItem;
  },
  updateMenuItem(itemId: string, input: UpdateMenuItemDto): MenuItem {
    const target = items.find((entry) => entry.id === itemId);
    if (!target) {
      throw new Error('Menu item not found');
    }

    const updated = { ...target, ...input };
    items = items.map((entry) => (entry.id === itemId ? updated : entry));
    return updated;
  },
  listOrders(status?: KitchenOrderStatus): KitchenOrder[] {
    const filtered = status ? orders.filter((order) => order.status === status) : orders;
    return [...filtered].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  },
  createOrder(input: CreateKitchenOrderDto): KitchenOrder {
    const mappedItems = input.items.map((entry, index) => {
      const menuItem = items.find((item) => item.id === entry.menuItemId && item.active);
      if (!menuItem) {
        throw new Error('Menu item is not active or missing');
      }

      return {
        id: `oi-${Date.now()}-${index}`,
        menuItemId: menuItem.id,
        menuItemName: menuItem.name,
        quantity: entry.quantity,
        unitPrice: menuItem.price,
        lineTotal: menuItem.price * entry.quantity,
        itemNote: entry.itemNote,
      };
    });

    const totalAmount = mappedItems.reduce((sum, entry) => sum + entry.lineTotal, 0);
    const createdAt = new Date().toISOString();
    const nextSequence = 1000 + orders.length + 1;

    const order: KitchenOrder = {
      id: `ord-${nextSequence}`,
      code: `K-${nextSequence}`,
      stayId: input.stayId,
      roomLabel: 'Room linked to stay',
      guestLabel: 'Guest linked to stay',
      status: KitchenOrderStatuses.NEW,
      notes: input.notes,
      items: mappedItems,
      totalAmount,
      chargePostedAt: null,
      createdAt,
      updatedAt: createdAt,
    };

    orders = [order, ...orders];
    return order;
  },
  updateOrder(orderId: string, input: UpdateKitchenOrderDto): KitchenOrder {
    const order = findOrderOrThrow(orderId);
    if (order.status !== KitchenOrderStatuses.NEW && order.status !== KitchenOrderStatuses.ACCEPTED) {
      throw new Error('Order can only be modified in NEW or ACCEPTED state');
    }

    let nextItems = order.items;
    if (input.items) {
      nextItems = input.items.map((entry, index) => {
        const menuItem = items.find((item) => item.id === entry.menuItemId);
        if (!menuItem) {
          throw new Error('Menu item not found');
        }

        return {
          id: `oi-${Date.now()}-${index}`,
          menuItemId: menuItem.id,
          menuItemName: menuItem.name,
          quantity: entry.quantity,
          unitPrice: menuItem.price,
          lineTotal: menuItem.price * entry.quantity,
          itemNote: entry.itemNote,
        };
      });
    }

    const totalAmount = nextItems.reduce((sum, entry) => sum + entry.lineTotal, 0);
    const updated: KitchenOrder = {
      ...order,
      notes: input.notes ?? order.notes,
      items: nextItems,
      totalAmount,
      updatedAt: new Date().toISOString(),
    };

    orders = orders.map((entry) => (entry.id === order.id ? updated : entry));
    return updated;
  },
  changeStatus(orderId: string, input: ChangeOrderStatusDto): KitchenOrder {
    const order = findOrderOrThrow(orderId);
    validateTransition(order.status, input.toStatus);

    const updated: KitchenOrder = {
      ...order,
      status: input.toStatus,
      updatedAt: new Date().toISOString(),
    };
    orders = orders.map((entry) => (entry.id === order.id ? updated : entry));
    return updated;
  },
  cancelOrder(orderId: string, input: CancelOrderDto): KitchenOrder {
    const order = findOrderOrThrow(orderId);
    if (order.status !== KitchenOrderStatuses.NEW && order.status !== KitchenOrderStatuses.ACCEPTED) {
      throw new Error('Only NEW or ACCEPTED orders can be cancelled by kitchen staff');
    }

    const updated: KitchenOrder = {
      ...order,
      status: KitchenOrderStatuses.CANCELLED,
      cancelledReason: input.reason,
      updatedAt: new Date().toISOString(),
    };

    orders = orders.map((entry) => (entry.id === order.id ? updated : entry));
    return updated;
  },
  cancelOrderWithOverride(orderId: string, input: CancelOrderDto): KitchenOrder {
    const order = findOrderOrThrow(orderId);
    if (order.status !== KitchenOrderStatuses.IN_PREP && order.status !== KitchenOrderStatuses.READY) {
      throw new Error('Override cancellation applies to IN_PREP or READY orders only');
    }

    const updated: KitchenOrder = {
      ...order,
      status: KitchenOrderStatuses.CANCELLED_WITH_REASON,
      cancelledReason: input.reason,
      updatedAt: new Date().toISOString(),
    };

    orders = orders.map((entry) => (entry.id === order.id ? updated : entry));
    return updated;
  },
  postCharge(orderId: string, _input: PostKitchenChargeDto): KitchenOrder {
    const order = findOrderOrThrow(orderId);
    if (order.status !== KitchenOrderStatuses.DELIVERED) {
      throw new Error('Charges can only be posted for DELIVERED orders');
    }

    if (order.chargePostedAt) {
      return order;
    }

    const updated: KitchenOrder = {
      ...order,
      chargePostedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    orders = orders.map((entry) => (entry.id === order.id ? updated : entry));
    return updated;
  },
  getReport(): KitchenReport {
    return computeReport();
  },
};
