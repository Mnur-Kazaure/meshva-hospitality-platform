import type { CreateMenuCategoryDto, CreateMenuItemDto, UpdateMenuItemDto } from '../../../shared/types/contracts';
import { apiClient } from '../../../shared/lib/api/client';
import { kitchenStore } from '../../../shared/lib/utils/kitchen-store';
import type { MenuCategory, MenuItem } from '../model/types';

export async function getMenuCategories(propertyId?: string): Promise<MenuCategory[]> {
  if (!propertyId) {
    return kitchenStore.listMenuCategories();
  }

  try {
    return await apiClient.get<MenuCategory[]>(`/properties/${propertyId}/kitchen/menu/categories`);
  } catch {
    return kitchenStore.listMenuCategories();
  }
}

export async function createMenuCategory(propertyId: string | undefined, dto: CreateMenuCategoryDto): Promise<MenuCategory> {
  if (!propertyId) {
    return kitchenStore.createMenuCategory(dto);
  }

  try {
    return await apiClient.post<MenuCategory>(`/properties/${propertyId}/kitchen/menu/categories`, dto, 'menu-category-create');
  } catch {
    return kitchenStore.createMenuCategory(dto);
  }
}

export async function getMenuItems(propertyId?: string): Promise<MenuItem[]> {
  if (!propertyId) {
    return kitchenStore.listMenuItems();
  }

  try {
    return await apiClient.get<MenuItem[]>(`/properties/${propertyId}/kitchen/menu/items`);
  } catch {
    return kitchenStore.listMenuItems();
  }
}

export async function createMenuItem(propertyId: string | undefined, dto: CreateMenuItemDto): Promise<MenuItem> {
  if (!propertyId) {
    return kitchenStore.createMenuItem(dto);
  }

  try {
    return await apiClient.post<MenuItem>(`/properties/${propertyId}/kitchen/menu/items`, dto, 'menu-item-create');
  } catch {
    return kitchenStore.createMenuItem(dto);
  }
}

export async function updateMenuItem(
  propertyId: string | undefined,
  itemId: string,
  dto: UpdateMenuItemDto,
): Promise<MenuItem> {
  if (!propertyId) {
    return kitchenStore.updateMenuItem(itemId, dto);
  }

  try {
    return await apiClient.patch<MenuItem>(`/properties/${propertyId}/kitchen/menu/items/${itemId}`, dto, 'menu-item-update');
  } catch {
    return kitchenStore.updateMenuItem(itemId, dto);
  }
}
