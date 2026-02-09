import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getPlatformHealthOverview,
  getClientHealthScore,
  getClientHealthDetail,
  getClientHealthHistory,
  getAtRiskClients,
  getClientsByTrend,
  recalculateHealthScore,
  exportAtRiskClientsToCsv,
} from '@/api/endpoints/health'
import type { RiskLevel, HealthTrend } from '@/api/endpoints/health'

// Query key factory
export const healthKeys = {
  all: ['health'] as const,
  overview: () => [...healthKeys.all, 'overview'] as const,
  score: (organizationId: string) =>
    [...healthKeys.all, 'score', organizationId] as const,
  detail: (organizationId: string) =>
    [...healthKeys.all, 'detail', organizationId] as const,
  history: (organizationId: string, days: number) =>
    [...healthKeys.all, 'history', organizationId, days] as const,
  atRisk: (riskLevel?: RiskLevel, limit?: number) =>
    [...healthKeys.all, 'at-risk', riskLevel, limit] as const,
  byTrend: (trend: HealthTrend, limit: number) =>
    [...healthKeys.all, 'by-trend', trend, limit] as const,
}

// ============================================
// Query hooks
// ============================================

export function usePlatformHealthOverview() {
  return useQuery({
    queryKey: healthKeys.overview(),
    queryFn: getPlatformHealthOverview,
    staleTime: 300_000,
  })
}

export function useClientHealthScore(organizationId: string) {
  return useQuery({
    queryKey: healthKeys.score(organizationId),
    queryFn: () => getClientHealthScore(organizationId),
    staleTime: 300_000,
    enabled: !!organizationId,
  })
}

export function useClientHealthDetail(organizationId: string) {
  return useQuery({
    queryKey: healthKeys.detail(organizationId),
    queryFn: () => getClientHealthDetail(organizationId),
    staleTime: 300_000,
    enabled: !!organizationId,
  })
}

export function useClientHealthHistory(organizationId: string, days: number = 30) {
  return useQuery({
    queryKey: healthKeys.history(organizationId, days),
    queryFn: () => getClientHealthHistory(organizationId, days),
    staleTime: 300_000,
    enabled: !!organizationId,
  })
}

export function useAtRiskClients(riskLevel?: RiskLevel, limit: number = 50) {
  return useQuery({
    queryKey: healthKeys.atRisk(riskLevel, limit),
    queryFn: () => getAtRiskClients(riskLevel, limit),
    staleTime: 300_000,
  })
}

export function useClientsByTrend(trend: HealthTrend, limit: number = 50) {
  return useQuery({
    queryKey: healthKeys.byTrend(trend, limit),
    queryFn: () => getClientsByTrend(trend, limit),
    staleTime: 300_000,
  })
}

// ============================================
// Mutation hooks
// ============================================

export function useRecalculateHealthScore() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (organizationId: string) => recalculateHealthScore(organizationId),
    onSuccess: (_data, organizationId) => {
      queryClient.invalidateQueries({
        queryKey: healthKeys.score(organizationId),
      })
      queryClient.invalidateQueries({
        queryKey: healthKeys.detail(organizationId),
      })
      queryClient.invalidateQueries({ queryKey: healthKeys.overview() })
    },
  })
}

export function useExportAtRiskClientsToCsv() {
  return useMutation({
    mutationFn: (riskLevel?: RiskLevel) => exportAtRiskClientsToCsv(riskLevel),
  })
}
