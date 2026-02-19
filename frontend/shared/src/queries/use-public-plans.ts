import { useQuery } from "@tanstack/react-query";
import { getPublicPlans } from "../lib/api/public-plans";
import type { PublicClientPlan } from "../types/public-plans";

/**
 * Query key for public plans.
 */
export const publicPlansQueryKey = ["public-plans"] as const;

/**
 * React Query hook to fetch public client plans.
 * Used on landing page for pricing display.
 *
 * - Caches for 5 minutes (staleTime)
 * - Keeps cache for 10 minutes (gcTime)
 * - Retries once on failure
 */
export function usePublicPlans() {
  return useQuery<PublicClientPlan[], Error>({
    queryKey: publicPlansQueryKey,
    queryFn: getPublicPlans,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: false, // No retry — backend may be offline for public website
    meta: { suppressErrors: true },
  });
}
