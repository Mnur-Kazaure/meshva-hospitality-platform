'use client';

import { useMemo } from 'react';
import { getMenuCategories, getMenuItems } from '../api/menu-api';
import type { MenuCategory, MenuItem } from './types';
import { useAsyncQuery } from '../../../shared/lib/hooks/use-async-query';

interface UseMenuQueryResult {
  categories: MenuCategory[];
  items: MenuItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useMenuQuery(propertyId?: string): UseMenuQueryResult {
  const categoriesQuery = useAsyncQuery<MenuCategory[]>(
    `menu-categories:${propertyId ?? 'none'}`,
    () => getMenuCategories(propertyId),
    [],
  );

  const itemsQuery = useAsyncQuery<MenuItem[]>(
    `menu-items:${propertyId ?? 'none'}`,
    () => getMenuItems(propertyId),
    [],
  );

  const isLoading = categoriesQuery.isLoading || itemsQuery.isLoading;
  const error = categoriesQuery.error ?? itemsQuery.error;

  const refetch = useMemo(() => {
    return async () => {
      await Promise.all([categoriesQuery.refetch(), itemsQuery.refetch()]);
    };
  }, [categoriesQuery, itemsQuery]);

  return {
    categories: categoriesQuery.data,
    items: itemsQuery.data,
    isLoading,
    error,
    refetch,
  };
}
