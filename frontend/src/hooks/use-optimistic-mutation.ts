"use client";

import { useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import type { PageResponse } from "@/types/api";

/**
 * Options for useOptimisticMutation hook
 */
interface OptimisticMutationOptions<TData, TVariables, TError = Error> {
  /** The async function that performs the mutation */
  mutationFn: (variables: TVariables) => Promise<TData>;
  /** The query key to update optimistically */
  queryKey: readonly unknown[];
  /** Function to compute the optimistic update */
  optimisticUpdate: (oldData: TData | undefined, variables: TVariables) => TData;
  /** Additional query keys to invalidate on success */
  invalidateKeys?: readonly unknown[][];
  /** Callback when mutation succeeds */
  onSuccess?: (data: TData, variables: TVariables) => void;
  /** Callback when mutation fails */
  onError?: (error: TError, variables: TVariables) => void;
  /** Callback when mutation settles (success or error) */
  onSettled?: () => void;
}

/**
 * A hook that wraps useMutation with optimistic update support.
 * Automatically handles rollback on error.
 *
 * @example
 * ```tsx
 * const activateClient = useOptimisticMutation({
 *   mutationFn: (id: string) => api.activateClient(id),
 *   queryKey: clientKeys.lists(),
 *   optimisticUpdate: (old, id) => ({
 *     ...old,
 *     content: old.content.map(c =>
 *       c.id === id ? { ...c, status: "ACTIVE" } : c
 *     ),
 *   }),
 *   invalidateKeys: [clientKeys.stats()],
 * });
 * ```
 */
export function useOptimisticMutation<TData, TVariables, TError = Error>({
  mutationFn,
  queryKey,
  optimisticUpdate,
  invalidateKeys = [],
  onSuccess,
  onError,
  onSettled,
}: OptimisticMutationOptions<TData, TVariables, TError>) {
  const queryClient = useQueryClient();

  return useMutation<TData, TError, TVariables, { previousData: TData | undefined }>({
    mutationFn,

    onMutate: async (variables) => {
      // Cancel any outgoing refetches to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<TData>(queryKey);

      // Optimistically update the cache
      queryClient.setQueryData<TData>(queryKey, (old) => optimisticUpdate(old, variables));

      // Return a context with the previous data for rollback
      return { previousData };
    },

    onError: (error, variables, context) => {
      // Rollback to the previous value on error
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      onError?.(error, variables);
    },

    onSuccess: (data, variables) => {
      onSuccess?.(data, variables);
    },

    onSettled: () => {
      // Always invalidate after mutation settles
      queryClient.invalidateQueries({ queryKey });

      // Invalidate additional keys
      invalidateKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });

      onSettled?.();
    },
  });
}

/**
 * Helper for optimistic updates on paginated lists
 */
export function createListOptimisticUpdate<T extends { id: string }>(
  itemId: string,
  updates: Partial<T>
) {
  return (old: PageResponse<T> | undefined): PageResponse<T> | undefined => {
    if (!old) return old;
    return {
      ...old,
      content: old.content.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item
      ),
    };
  };
}

/**
 * Helper for optimistic deletion from paginated lists
 */
export function createListOptimisticDelete<T extends { id: string }>(itemId: string) {
  return (old: PageResponse<T> | undefined): PageResponse<T> | undefined => {
    if (!old) return old;
    return {
      ...old,
      content: old.content.filter((item) => item.id !== itemId),
      totalElements: old.totalElements - 1,
    };
  };
}

/**
 * Helper for optimistic addition to paginated lists
 */
export function createListOptimisticAdd<T>(newItem: T) {
  return (old: PageResponse<T> | undefined): PageResponse<T> | undefined => {
    if (!old) return old;
    return {
      ...old,
      content: [newItem, ...old.content],
      totalElements: old.totalElements + 1,
    };
  };
}
