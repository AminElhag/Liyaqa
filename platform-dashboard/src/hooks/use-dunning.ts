import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getActiveDunning,
  getDunningSequences,
  getDunningStatistics,
  getDunningDetail,
  getOrganizationDunning,
  retryPayment,
  sendPaymentLink,
  escalateToCsm,
  pauseDunning,
  resumeDunning,
  cancelDunning,
  markAsRecovered,
  addDunningNote,
  getDunningByStatus,
  exportDunningToCsv,
  getRevenueAtRisk,
} from '@/api/endpoints/dunning'
import type { DunningFilters, DunningSequenceStatus } from '@/types'

// Query key factory
export const dunningKeys = {
  all: ['dunning'] as const,
  lists: () => [...dunningKeys.all, 'list'] as const,
  list: (filters?: DunningFilters) => [...dunningKeys.lists(), filters] as const,
  active: (limit: number) => [...dunningKeys.all, 'active', limit] as const,
  stats: () => [...dunningKeys.all, 'stats'] as const,
  details: () => [...dunningKeys.all, 'detail'] as const,
  detail: (id: string) => [...dunningKeys.details(), id] as const,
  byOrganization: (organizationId: string) =>
    [...dunningKeys.all, 'org', organizationId] as const,
  byStatus: (status: DunningSequenceStatus, limit: number) =>
    [...dunningKeys.all, 'by-status', status, limit] as const,
  revenueAtRisk: () => [...dunningKeys.all, 'revenue-at-risk'] as const,
}

// ============================================
// Query hooks
// ============================================

export function useDunningSequences(filters?: DunningFilters) {
  return useQuery({
    queryKey: dunningKeys.list(filters),
    queryFn: () => getDunningSequences(filters),
    staleTime: 120_000,
  })
}

export function useActiveDunning(limit: number = 50) {
  return useQuery({
    queryKey: dunningKeys.active(limit),
    queryFn: () => getActiveDunning(limit),
    staleTime: 120_000,
  })
}

export function useDunningStatistics() {
  return useQuery({
    queryKey: dunningKeys.stats(),
    queryFn: getDunningStatistics,
    staleTime: 300_000,
  })
}

export function useDunningDetail(dunningId: string) {
  return useQuery({
    queryKey: dunningKeys.detail(dunningId),
    queryFn: () => getDunningDetail(dunningId),
    staleTime: 60_000,
    enabled: !!dunningId,
  })
}

export function useOrganizationDunning(organizationId: string) {
  return useQuery({
    queryKey: dunningKeys.byOrganization(organizationId),
    queryFn: () => getOrganizationDunning(organizationId),
    staleTime: 120_000,
    enabled: !!organizationId,
  })
}

export function useDunningByStatus(status: DunningSequenceStatus, limit: number = 50) {
  return useQuery({
    queryKey: dunningKeys.byStatus(status, limit),
    queryFn: () => getDunningByStatus(status, limit),
    staleTime: 120_000,
  })
}

export function useRevenueAtRisk() {
  return useQuery({
    queryKey: dunningKeys.revenueAtRisk(),
    queryFn: getRevenueAtRisk,
    staleTime: 300_000,
  })
}

// ============================================
// Mutation hooks
// ============================================

export function useRetryPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dunningId: string) => retryPayment(dunningId),
    onSuccess: (_data, dunningId) => {
      queryClient.invalidateQueries({ queryKey: dunningKeys.detail(dunningId) })
      queryClient.invalidateQueries({ queryKey: dunningKeys.lists() })
      queryClient.invalidateQueries({ queryKey: dunningKeys.stats() })
    },
  })
}

export function useSendPaymentLink() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dunningId: string) => sendPaymentLink(dunningId),
    onSuccess: (_data, dunningId) => {
      queryClient.invalidateQueries({ queryKey: dunningKeys.detail(dunningId) })
    },
  })
}

export function useEscalateToCsm() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      dunningId,
      csmId,
      notes,
    }: {
      dunningId: string
      csmId?: string
      notes?: string
    }) => escalateToCsm(dunningId, csmId, notes),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: dunningKeys.detail(variables.dunningId),
      })
      queryClient.invalidateQueries({ queryKey: dunningKeys.lists() })
    },
  })
}

export function usePauseDunning() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ dunningId, reason }: { dunningId: string; reason?: string }) =>
      pauseDunning(dunningId, reason),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: dunningKeys.detail(variables.dunningId),
      })
      queryClient.invalidateQueries({ queryKey: dunningKeys.lists() })
      queryClient.invalidateQueries({ queryKey: dunningKeys.stats() })
    },
  })
}

export function useResumeDunning() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dunningId: string) => resumeDunning(dunningId),
    onSuccess: (_data, dunningId) => {
      queryClient.invalidateQueries({ queryKey: dunningKeys.detail(dunningId) })
      queryClient.invalidateQueries({ queryKey: dunningKeys.lists() })
      queryClient.invalidateQueries({ queryKey: dunningKeys.stats() })
    },
  })
}

export function useCancelDunning() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ dunningId, reason }: { dunningId: string; reason?: string }) =>
      cancelDunning(dunningId, reason),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: dunningKeys.detail(variables.dunningId),
      })
      queryClient.invalidateQueries({ queryKey: dunningKeys.lists() })
      queryClient.invalidateQueries({ queryKey: dunningKeys.stats() })
    },
  })
}

export function useMarkAsRecovered() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ dunningId, notes }: { dunningId: string; notes?: string }) =>
      markAsRecovered(dunningId, notes),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: dunningKeys.detail(variables.dunningId),
      })
      queryClient.invalidateQueries({ queryKey: dunningKeys.lists() })
      queryClient.invalidateQueries({ queryKey: dunningKeys.stats() })
    },
  })
}

export function useAddDunningNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ dunningId, note }: { dunningId: string; note: string }) =>
      addDunningNote(dunningId, note),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: dunningKeys.detail(variables.dunningId),
      })
    },
  })
}

export function useExportDunningToCsv() {
  return useMutation({
    mutationFn: (filters?: DunningFilters) => exportDunningToCsv(filters),
  })
}
