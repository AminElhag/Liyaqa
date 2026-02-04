"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  getPlatformHealthOverview,
  getClientHealthScore,
  getClientHealthDetail,
  getClientHealthHistory,
  getAtRiskClients,
  getClientsByTrend,
  recalculateHealthScore,
  type PlatformHealthOverview,
  type ClientHealthScore,
  type ClientHealthDetail,
  type HealthHistoryPoint,
  type RiskLevel,
  type HealthTrend,
} from "../lib/api/platform/health";

// Query keys
export const healthKeys = {
  all: ["platform", "health"] as const,
  overview: () => [...healthKeys.all, "overview"] as const,
  client: (organizationId: string) =>
    [...healthKeys.all, "client", organizationId] as const,
  clientDetail: (organizationId: string) =>
    [...healthKeys.all, "clientDetail", organizationId] as const,
  history: (organizationId: string, days: number) =>
    [...healthKeys.all, "history", organizationId, days] as const,
  atRisk: (riskLevel?: RiskLevel, limit?: number) =>
    [...healthKeys.all, "atRisk", riskLevel, limit] as const,
  byTrend: (trend: HealthTrend, limit: number) =>
    [...healthKeys.all, "byTrend", trend, limit] as const,
};

/**
 * Hook to fetch platform health overview
 */
export function usePlatformHealthOverview(
  options?: Omit<UseQueryOptions<PlatformHealthOverview>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: healthKeys.overview(),
    queryFn: () => getPlatformHealthOverview(),
    ...options,
  });
}

/**
 * Hook to fetch client health score
 */
export function useClientHealthScore(
  organizationId: string,
  options?: Omit<UseQueryOptions<ClientHealthScore>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: healthKeys.client(organizationId),
    queryFn: () => getClientHealthScore(organizationId),
    enabled: !!organizationId,
    ...options,
  });
}

/**
 * Hook to fetch client health detail with interventions
 */
export function useClientHealthDetail(
  organizationId: string,
  options?: Omit<UseQueryOptions<ClientHealthDetail>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: healthKeys.clientDetail(organizationId),
    queryFn: () => getClientHealthDetail(organizationId),
    enabled: !!organizationId,
    ...options,
  });
}

/**
 * Hook to fetch client health history
 */
export function useClientHealthHistory(
  organizationId: string,
  days: number = 30,
  options?: Omit<UseQueryOptions<HealthHistoryPoint[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: healthKeys.history(organizationId, days),
    queryFn: () => getClientHealthHistory(organizationId, days),
    enabled: !!organizationId,
    ...options,
  });
}

/**
 * Hook to fetch at-risk clients
 */
export function useAtRiskClients(
  riskLevel?: RiskLevel,
  limit: number = 50,
  options?: Omit<UseQueryOptions<ClientHealthScore[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: healthKeys.atRisk(riskLevel, limit),
    queryFn: () => getAtRiskClients(riskLevel, limit),
    ...options,
  });
}

/**
 * Hook to fetch clients by health trend
 */
export function useClientsByTrend(
  trend: HealthTrend,
  limit: number = 50,
  options?: Omit<UseQueryOptions<ClientHealthScore[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: healthKeys.byTrend(trend, limit),
    queryFn: () => getClientsByTrend(trend, limit),
    ...options,
  });
}

/**
 * Hook to recalculate client health score
 */
export function useRecalculateHealthScore(
  options?: UseMutationOptions<ClientHealthScore, Error, string>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (organizationId) => recalculateHealthScore(organizationId),
    onSuccess: (data, organizationId) => {
      queryClient.setQueryData(healthKeys.client(organizationId), data);
      queryClient.invalidateQueries({ queryKey: healthKeys.overview() });
      queryClient.invalidateQueries({ queryKey: healthKeys.all });
    },
    ...options,
  });
}

// Re-export types for convenience
export type {
  PlatformHealthOverview,
  ClientHealthScore,
  ClientHealthDetail,
  HealthHistoryPoint,
  RiskLevel,
  HealthTrend,
};
