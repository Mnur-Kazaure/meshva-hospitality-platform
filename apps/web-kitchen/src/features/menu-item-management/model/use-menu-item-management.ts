'use client';

import { useAsyncMutation } from '../../../shared/lib/hooks/use-async-mutation';
import type { CreateMenuCategoryDto, CreateMenuItemDto, UpdateMenuItemDto } from '../../../shared/types/contracts';
import { createMenuCategory, createMenuItem, updateMenuItem } from '../../../entities/menu/api/menu-api';

export function useCreateMenuCategory(propertyId?: string) {
  return useAsyncMutation<CreateMenuCategoryDto, unknown>(
    (input) => createMenuCategory(propertyId, input),
    {
      invalidatePrefixes: ['menu-categories', 'menu-items'],
    },
  );
}

export function useCreateMenuItem(propertyId?: string) {
  return useAsyncMutation<CreateMenuItemDto, unknown>(
    (input) => createMenuItem(propertyId, input),
    {
      invalidatePrefixes: ['menu-items'],
    },
  );
}

interface UpdateMenuItemInput {
  itemId: string;
  dto: UpdateMenuItemDto;
}

export function useUpdateMenuItem(propertyId?: string) {
  return useAsyncMutation<UpdateMenuItemInput, unknown>(
    ({ itemId, dto }) => updateMenuItem(propertyId, itemId, dto),
    {
      invalidatePrefixes: ['menu-items'],
    },
  );
}
