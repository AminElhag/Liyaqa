"use client";

import { useMemo } from "react";

/**
 * Combines multiple loading states into a single state object.
 * Useful when a page has multiple queries and you want unified loading feedback.
 *
 * @example
 * ```tsx
 * const { data: clients, isLoading: clientsLoading } = useClients();
 * const { data: stats, isLoading: statsLoading } = useClientStats();
 *
 * const { isAnyLoading, isAllLoading, loadingCount } = useLoadingState([
 *   clientsLoading,
 *   statsLoading,
 * ]);
 *
 * if (isAllLoading) return <FullPageSkeleton />;
 * if (isAnyLoading) return <PartialSkeleton />;
 * ```
 */
export function useLoadingState(loadingStates: boolean[]) {
  return useMemo(() => {
    const loadingCount = loadingStates.filter(Boolean).length;
    return {
      /** True if any of the states is loading */
      isAnyLoading: loadingCount > 0,
      /** True if all states are loading */
      isAllLoading: loadingCount === loadingStates.length,
      /** Number of states currently loading */
      loadingCount,
      /** Total number of states being tracked */
      totalCount: loadingStates.length,
      /** Progress percentage (0-100) of completed loads */
      progress: Math.round(((loadingStates.length - loadingCount) / loadingStates.length) * 100),
    };
  }, [loadingStates]);
}

/**
 * Combines multiple error states into a single state.
 * Returns the first error found, if any.
 *
 * @example
 * ```tsx
 * const { error: clientsError } = useClients();
 * const { error: statsError } = useClientStats();
 *
 * const error = useCombinedError([clientsError, statsError]);
 *
 * if (error) return <ErrorDisplay error={error} />;
 * ```
 */
export function useCombinedError(errors: (Error | null | undefined)[]) {
  return useMemo(() => {
    return errors.find((e) => e != null) ?? null;
  }, [errors]);
}

/**
 * Hook to track mutation states across multiple mutations.
 * Useful for disabling UI while any mutation is in progress.
 *
 * @example
 * ```tsx
 * const createMutation = useCreateClient();
 * const updateMutation = useUpdateClient();
 * const deleteMutation = useDeleteClient();
 *
 * const { isPending, pendingCount } = useMutationState([
 *   createMutation.isPending,
 *   updateMutation.isPending,
 *   deleteMutation.isPending,
 * ]);
 *
 * <Button disabled={isPending}>Submit</Button>
 * ```
 */
export function useMutationState(pendingStates: boolean[]) {
  return useMemo(() => {
    const pendingCount = pendingStates.filter(Boolean).length;
    return {
      /** True if any mutation is pending */
      isPending: pendingCount > 0,
      /** Number of pending mutations */
      pendingCount,
    };
  }, [pendingStates]);
}
