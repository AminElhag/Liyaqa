"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import {
  getPlatformDashboard,
  getPlatformSummary,
  getPlatformRevenue,
  getMonthlyRevenue,
  getClientGrowth,
  getDealPipeline,
  getExpiringSubscriptions,
  getTopClients,
  getRecentActivity,
  getPlatformHealth,
  getSupportStats,
  type DateRangeParams,
} from "../../lib/api/platform/dashboard";
import type {
  PlatformDashboard,
  PlatformSummary,
  PlatformRevenue,
  MonthlyRevenue,
  ClientGrowth,
  DealPipelineOverview,
  ExpiringClientSubscription,
  TopClient,
  RecentActivity,
  PlatformHealth,
  SupportTicketStats,
} from "../../types/platform";

// Query keys
export const platformDashboardKeys = {
  all: ["platform", "dashboard"] as const,
  full: (timezone: string, dateRange?: DateRangeParams) =>
    [...platformDashboardKeys.all, "full", timezone, dateRange] as const,
  summary: () => [...platformDashboardKeys.all, "summary"] as const,
  revenue: (timezone: string, dateRange?: DateRangeParams) =>
    [...platformDashboardKeys.all, "revenue", timezone, dateRange] as const,
  monthlyRevenue: (months: number) =>
    [...platformDashboardKeys.all, "monthlyRevenue", months] as const,
  growth: () => [...platformDashboardKeys.all, "growth"] as const,
  dealPipeline: () => [...platformDashboardKeys.all, "dealPipeline"] as const,
  expiringSubscriptions: (daysAhead: number) =>
    [...platformDashboardKeys.all, "expiring", daysAhead] as const,
  topClients: (limit: number) =>
    [...platformDashboardKeys.all, "topClients", limit] as const,
  recentActivity: (limit: number) =>
    [...platformDashboardKeys.all, "activity", limit] as const,
  health: () => [...platformDashboardKeys.all, "health"] as const,
  supportStats: () => [...platformDashboardKeys.all, "supportStats"] as const,
};

/**
 * Hook to fetch complete platform dashboard
 */
export function usePlatformDashboard(
  timezone: string = "Asia/Riyadh",
  dateRange?: DateRangeParams,
  options?: Omit<UseQueryOptions<PlatformDashboard>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: platformDashboardKeys.full(timezone, dateRange),
    queryFn: () => getPlatformDashboard(timezone, dateRange),
    ...options,
  });
}

/**
 * Hook to fetch platform summary statistics
 */
export function usePlatformSummary(
  options?: Omit<UseQueryOptions<PlatformSummary>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: platformDashboardKeys.summary(),
    queryFn: () => getPlatformSummary(),
    ...options,
  });
}

/**
 * Hook to fetch platform revenue metrics (PLATFORM_ADMIN only)
 */
export function usePlatformRevenue(
  timezone: string = "Asia/Riyadh",
  dateRange?: DateRangeParams,
  options?: Omit<UseQueryOptions<PlatformRevenue>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: platformDashboardKeys.revenue(timezone, dateRange),
    queryFn: () => getPlatformRevenue(timezone, dateRange),
    ...options,
  });
}

/**
 * Hook to fetch monthly revenue breakdown
 */
export function useMonthlyRevenue(
  months: number = 12,
  options?: Omit<UseQueryOptions<MonthlyRevenue[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: platformDashboardKeys.monthlyRevenue(months),
    queryFn: () => getMonthlyRevenue(months),
    ...options,
  });
}

/**
 * Hook to fetch client growth metrics
 */
export function useClientGrowth(
  options?: Omit<UseQueryOptions<ClientGrowth>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: platformDashboardKeys.growth(),
    queryFn: () => getClientGrowth(),
    ...options,
  });
}

/**
 * Hook to fetch deal pipeline overview
 */
export function useDealPipeline(
  options?: Omit<UseQueryOptions<DealPipelineOverview>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: platformDashboardKeys.dealPipeline(),
    queryFn: () => getDealPipeline(),
    ...options,
  });
}

/**
 * Hook to fetch expiring subscriptions
 */
export function useExpiringSubscriptions(
  daysAhead: number = 30,
  options?: Omit<
    UseQueryOptions<ExpiringClientSubscription[]>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: platformDashboardKeys.expiringSubscriptions(daysAhead),
    queryFn: () => getExpiringSubscriptions(daysAhead),
    ...options,
  });
}

/**
 * Hook to fetch top clients by revenue
 */
export function useTopClients(
  limit: number = 10,
  options?: Omit<UseQueryOptions<TopClient[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: platformDashboardKeys.topClients(limit),
    queryFn: () => getTopClients(limit),
    ...options,
  });
}

/**
 * Hook to fetch recent platform activity
 */
export function useRecentActivity(
  limit: number = 20,
  options?: Omit<UseQueryOptions<RecentActivity[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: platformDashboardKeys.recentActivity(limit),
    queryFn: () => getRecentActivity(limit),
    ...options,
  });
}

/**
 * Hook to fetch platform health indicators
 */
export function usePlatformHealth(
  options?: Omit<UseQueryOptions<PlatformHealth>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: platformDashboardKeys.health(),
    queryFn: () => getPlatformHealth(),
    ...options,
  });
}

/**
 * Hook to fetch support ticket statistics
 */
export function useSupportStats(
  options?: Omit<UseQueryOptions<SupportTicketStats>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: platformDashboardKeys.supportStats(),
    queryFn: () => getSupportStats(),
    ...options,
  });
}
