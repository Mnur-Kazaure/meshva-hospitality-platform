import type {
  CancelOrderDto,
  ChangeOrderStatusDto,
  CreateKitchenOrderDto,
  KitchenOrderStatus,
  PostKitchenChargeDto,
  UpdateKitchenOrderDto,
} from '../../../shared/types/contracts';
import { apiClient } from '../../../shared/lib/api/client';
import { kitchenStore } from '../../../shared/lib/utils/kitchen-store';
import type { KitchenOrder } from '../model/types';

export async function getKitchenOrders(propertyId?: string, status?: KitchenOrderStatus): Promise<KitchenOrder[]> {
  if (!propertyId) {
    return kitchenStore.listOrders(status);
  }

  const statusQuery = status ? `?status=${encodeURIComponent(status)}` : '';
  try {
    return await apiClient.get<KitchenOrder[]>(`/properties/${propertyId}/kitchen/orders${statusQuery}`);
  } catch {
    return kitchenStore.listOrders(status);
  }
}

export async function createKitchenOrder(propertyId: string | undefined, dto: CreateKitchenOrderDto): Promise<KitchenOrder> {
  if (!propertyId) {
    return kitchenStore.createOrder(dto);
  }

  try {
    return await apiClient.post<KitchenOrder>(`/properties/${propertyId}/kitchen/orders`, dto, 'kitchen-order-create');
  } catch {
    return kitchenStore.createOrder(dto);
  }
}

export async function updateKitchenOrder(
  propertyId: string | undefined,
  orderId: string,
  dto: UpdateKitchenOrderDto,
): Promise<KitchenOrder> {
  if (!propertyId) {
    return kitchenStore.updateOrder(orderId, dto);
  }

  try {
    return await apiClient.patch<KitchenOrder>(`/properties/${propertyId}/kitchen/orders/${orderId}`, dto, 'kitchen-order-update');
  } catch {
    return kitchenStore.updateOrder(orderId, dto);
  }
}

export async function changeKitchenOrderStatus(
  propertyId: string | undefined,
  orderId: string,
  dto: ChangeOrderStatusDto,
): Promise<KitchenOrder> {
  if (!propertyId) {
    return kitchenStore.changeStatus(orderId, dto);
  }

  try {
    return await apiClient.post<KitchenOrder>(
      `/properties/${propertyId}/kitchen/orders/${orderId}/status`,
      dto,
      'kitchen-order-status',
    );
  } catch {
    return kitchenStore.changeStatus(orderId, dto);
  }
}

export async function cancelKitchenOrder(
  propertyId: string | undefined,
  orderId: string,
  dto: CancelOrderDto,
): Promise<KitchenOrder> {
  if (!propertyId) {
    return kitchenStore.cancelOrder(orderId, dto);
  }

  try {
    return await apiClient.post<KitchenOrder>(
      `/properties/${propertyId}/kitchen/orders/${orderId}/cancel`,
      dto,
      'kitchen-order-cancel',
    );
  } catch {
    return kitchenStore.cancelOrder(orderId, dto);
  }
}

export async function cancelKitchenOrderWithOverride(
  propertyId: string | undefined,
  orderId: string,
  dto: CancelOrderDto,
): Promise<KitchenOrder> {
  if (!propertyId) {
    return kitchenStore.cancelOrderWithOverride(orderId, dto);
  }

  try {
    return await apiClient.post<KitchenOrder>(
      `/properties/${propertyId}/kitchen/orders/${orderId}/cancel-override`,
      dto,
      'kitchen-order-cancel-override',
    );
  } catch {
    return kitchenStore.cancelOrderWithOverride(orderId, dto);
  }
}

export async function postKitchenOrderCharge(
  propertyId: string | undefined,
  orderId: string,
  dto: PostKitchenChargeDto,
): Promise<KitchenOrder> {
  if (!propertyId) {
    return kitchenStore.postCharge(orderId, dto);
  }

  try {
    return await apiClient.post<KitchenOrder>(
      `/properties/${propertyId}/kitchen/orders/${orderId}/post-charge`,
      dto,
      'kitchen-order-post-charge',
    );
  } catch {
    return kitchenStore.postCharge(orderId, dto);
  }
}
