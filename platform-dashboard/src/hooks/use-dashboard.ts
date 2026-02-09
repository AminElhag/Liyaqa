import { useQuery, useMutation } from '@tanstack/react-query'
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
  exportSummaryToCsv,
  exportRevenueToCsv,
  exportMonthlyRevenueToCsv,
  exportTopClientsToCsv,
  exportDashboardToPdf,
} from '@/api/endpoints/dashboard'
import type { DateRangeParams } from '@/api/endpoints/dashboard'

// Query key factory
export const dashboardKeys = {
  all: ['dashboard'] as const,
  full: (timezone: string, dateRange?: DateRangeParams) =>
    [...dashboardKeys.all, 'full', timezone, dateRange] as const,
  summary: () => [...dashboardKeys.all, 'summary'] as const,
  revenue: (timezone: string, dateRange?: DateRangeParams) =>
    [...dashboardKeys.all, 'revenue', timezone, dateRange] as const,
  monthlyRevenue: (months: number) =>
    [...dashboardKeys.all, 'monthly-revenue', months] as const,
  growth: () => [...dashboardKeys.all, 'growth'] as const,
  pipeline: () => [...dashboardKeys.all, 'pipeline'] as const,
  expiringSubscriptions: (daysAhead: number) =>
    [...dashboardKeys.all, 'expiring-subscriptions', daysAhead] as const,
  topClients: (limit: number) =>
    [...dashboardKeys.all, 'top-clients', limit] as const,
  recentActivity: (limit: number) =>
    [...dashboardKeys.all, 'recent-activity', limit] as const,
  health: () => [...dashboardKeys.all, 'health'] as const,
  supportStats: () => [...dashboardKeys.all, 'support-stats'] as const,
}

// ============================================
// Query hooks — all use dashboard staleTime (5 min)
// ============================================

export function usePlatformDashboard(
  timezone: string = 'Asia/Riyadh',
  dateRange?: DateRangeParams,
) {
  return useQuery({
    queryKey: dashboardKeys.full(timezone, dateRange),
    queryFn: () => getPlatformDashboard(timezone, dateRange),
    staleTime: 300_000,
  })
}

export function usePlatformSummary() {
  return useQuery({
    queryKey: dashboardKeys.summary(),
    queryFn: getPlatformSummary,
    staleTime: 300_000,
  })
}

export function usePlatformRevenue(
  timezone: string = 'Asia/Riyadh',
  dateRange?: DateRangeParams,
) {
  return useQuery({
    queryKey: dashboardKeys.revenue(timezone, dateRange),
    queryFn: () => getPlatformRevenue(timezone, dateRange),
    staleTime: 300_000,
  })
}

export function useMonthlyRevenue(months: number = 12) {
  return useQuery({
    queryKey: dashboardKeys.monthlyRevenue(months),
    queryFn: () => getMonthlyRevenue(months),
    staleTime: 300_000,
  })
}

export function useClientGrowth() {
  return useQuery({
    queryKey: dashboardKeys.growth(),
    queryFn: getClientGrowth,
    staleTime: 300_000,
  })
}

export function useDealPipeline() {
  return useQuery({
    queryKey: dashboardKeys.pipeline(),
    queryFn: getDealPipeline,
    staleTime: 300_000,
  })
}

export function useExpiringSubscriptions(daysAhead: number = 30) {
  return useQuery({
    queryKey: dashboardKeys.expiringSubscriptions(daysAhead),
    queryFn: () => getExpiringSubscriptions(daysAhead),
    staleTime: 300_000,
  })
}

export function useTopClients(limit: number = 10) {
  return useQuery({
    queryKey: dashboardKeys.topClients(limit),
    queryFn: () => getTopClients(limit),
    staleTime: 300_000,
  })
}

export function useRecentActivity(limit: number = 20) {
  return useQuery({
    queryKey: dashboardKeys.recentActivity(limit),
    queryFn: () => getRecentActivity(limit),
    staleTime: 300_000,
  })
}

export function usePlatformHealthDashboard() {
  return useQuery({
    queryKey: dashboardKeys.health(),
    queryFn: getPlatformHealth,
    staleTime: 300_000,
  })
}

export function useSupportStats() {
  return useQuery({
    queryKey: dashboardKeys.supportStats(),
    queryFn: getSupportStats,
    staleTime: 300_000,
  })
}

// ============================================
// Export mutation hooks
// ============================================

export function useExportSummaryToCsv() {
  return useMutation({
    mutationFn: () => exportSummaryToCsv(),
  })
}

export function useExportRevenueToCsv() {
  return useMutation({
    mutationFn: (timezone: string = 'Asia/Riyadh') => exportRevenueToCsv(timezone),
  })
}

export function useExportMonthlyRevenueToCsv() {
  return useMutation({
    mutationFn: (months: number = 12) => exportMonthlyRevenueToCsv(months),
  })
}

export function useExportTopClientsToCsv() {
  return useMutation({
    mutationFn: (limit: number = 10) => exportTopClientsToCsv(limit),
  })
}

export function useExportDashboardToPdf() {
  return useMutation({
    mutationFn: (timezone: string = 'Asia/Riyadh') => exportDashboardToPdf(timezone),
  })
}
