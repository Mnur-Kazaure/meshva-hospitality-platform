'use client';

import { useState } from 'react';
import { invalidateQueryCache } from './query-cache';

interface UseAsyncMutationOptions<TInput, TResult> {
  invalidatePrefixes?: string[];
  onSuccess?: (result: TResult, input: TInput) => void;
}

export interface UseAsyncMutationResult<TInput, TResult> {
  mutate: (input: TInput) => Promise<TResult | null>;
  isPending: boolean;
  error: string | null;
}

export function useAsyncMutation<TInput, TResult>(
  mutateFn: (input: TInput) => Promise<TResult>,
  options?: UseAsyncMutationOptions<TInput, TResult>,
): UseAsyncMutationResult<TInput, TResult> {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = async (input: TInput): Promise<TResult | null> => {
    setIsPending(true);
    setError(null);
    try {
      const result = await mutateFn(input);
      options?.invalidatePrefixes?.forEach((prefix) => invalidateQueryCache(prefix));
      options?.onSuccess?.(result, input);
      return result;
    } catch (mutationError) {
      const message = mutationError instanceof Error ? mutationError.message : 'Mutation failed';
      setError(message);
      return null;
    } finally {
      setIsPending(false);
    }
  };

  return { mutate, isPending, error };
}
