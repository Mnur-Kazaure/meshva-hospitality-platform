'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { readQueryCache, subscribeQueryCache, writeQueryCache } from './query-cache';

export interface UseAsyncQueryResult<T> {
  data: T;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAsyncQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  fallbackData: T,
): UseAsyncQueryResult<T> {
  const cached = useMemo(() => readQueryCache<T>(key), [key]);
  const [data, setData] = useState<T>(cached ?? fallbackData);
  const [isLoading, setIsLoading] = useState<boolean>(cached === undefined);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      writeQueryCache(key, result);
      setData(result);
    } catch (queryError) {
      const message = queryError instanceof Error ? queryError.message : 'Failed to load data';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [fetcher, key]);

  useEffect(() => {
    const fromCache = readQueryCache<T>(key);
    if (fromCache !== undefined) {
      setData(fromCache);
      setIsLoading(false);
      return;
    }

    load();
  }, [key, load]);

  useEffect(() => {
    return subscribeQueryCache(() => {
      const fromCache = readQueryCache<T>(key);
      if (fromCache !== undefined) {
        setData(fromCache);
      }
    });
  }, [key]);

  return {
    data,
    isLoading,
    error,
    refetch: load,
  };
}
