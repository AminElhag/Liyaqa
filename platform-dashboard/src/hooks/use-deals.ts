import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createDeal,
  getDeal,
  getDeals,
  getDealsByStatus,
  getDealsBySource,
  getOpenDeals,
  getExpiringDeals,
  getMyDeals,
  getDealsBySalesRep,
  updateDeal,
  deleteDeal,
  advanceDeal,
  qualifyDeal,
  sendProposal,
  startNegotiation,
  convertDeal,
  loseDeal,
  reopenDeal,
  reassignDeal,
  getDealStats,
  getMyDealStats,
  getSalesRepDealStats,
} from '@/api/endpoints/deals'
import type {
  DealQueryParams,
  DealStatus,
  DealSource,
  CreateDealRequest,
  UpdateDealRequest,
  ConvertDealRequest,
  LoseDealRequest,
  ReassignDealRequest,
} from '@/types'

// Query key factory
export const dealKeys = {
  all: ['deals'] as const,
  lists: () => [...dealKeys.all, 'list'] as const,
  list: (filters: DealQueryParams) => [...dealKeys.lists(), filters] as const,
  byStatus: (status: DealStatus, filters: DealQueryParams) =>
    [...dealKeys.lists(), 'status', status, filters] as const,
  bySource: (source: DealSource, filters: DealQueryParams) =>
    [...dealKeys.lists(), 'source', source, filters] as const,
  open: (filters: DealQueryParams) => [...dealKeys.lists(), 'open', filters] as const,
  expiring: (daysAhead: number) => [...dealKeys.lists(), 'expiring', daysAhead] as const,
  myDeals: (filters: DealQueryParams) => [...dealKeys.lists(), 'mine', filters] as const,
  bySalesRep: (salesRepId: string, filters: DealQueryParams) =>
    [...dealKeys.lists(), 'sales-rep', salesRepId, filters] as const,
  details: () => [...dealKeys.all, 'detail'] as const,
  detail: (id: string) => [...dealKeys.details(), id] as const,
  stats: () => [...dealKeys.all, 'stats'] as const,
  myStats: () => [...dealKeys.all, 'my-stats'] as const,
  salesRepStats: (salesRepId: string) =>
    [...dealKeys.all, 'sales-rep-stats', salesRepId] as const,
}

// ============================================
// Query hooks
// ============================================

export function useDeals(params: DealQueryParams = {}) {
  return useQuery({
    queryKey: dealKeys.list(params),
    queryFn: () => getDeals(params),
    staleTime: 120_000,
  })
}

export function useDeal(id: string) {
  return useQuery({
    queryKey: dealKeys.detail(id),
    queryFn: () => getDeal(id),
    staleTime: 60_000,
    enabled: !!id,
  })
}

export function useDealsByStatus(status: DealStatus, params: DealQueryParams = {}) {
  return useQuery({
    queryKey: dealKeys.byStatus(status, params),
    queryFn: () => getDealsByStatus(status, params),
    staleTime: 120_000,
  })
}

export function useDealsBySource(source: DealSource, params: DealQueryParams = {}) {
  return useQuery({
    queryKey: dealKeys.bySource(source, params),
    queryFn: () => getDealsBySource(source, params),
    staleTime: 120_000,
  })
}

export function useOpenDeals(params: DealQueryParams = {}) {
  return useQuery({
    queryKey: dealKeys.open(params),
    queryFn: () => getOpenDeals(params),
    staleTime: 120_000,
  })
}

export function useExpiringDeals(daysAhead: number = 30) {
  return useQuery({
    queryKey: dealKeys.expiring(daysAhead),
    queryFn: () => getExpiringDeals(daysAhead),
    staleTime: 120_000,
  })
}

export function useMyDeals(params: DealQueryParams = {}) {
  return useQuery({
    queryKey: dealKeys.myDeals(params),
    queryFn: () => getMyDeals(params),
    staleTime: 120_000,
  })
}

export function useDealsBySalesRep(salesRepId: string, params: DealQueryParams = {}) {
  return useQuery({
    queryKey: dealKeys.bySalesRep(salesRepId, params),
    queryFn: () => getDealsBySalesRep(salesRepId, params),
    staleTime: 120_000,
    enabled: !!salesRepId,
  })
}

export function useDealStats() {
  return useQuery({
    queryKey: dealKeys.stats(),
    queryFn: getDealStats,
    staleTime: 300_000,
  })
}

export function useMyDealStats() {
  return useQuery({
    queryKey: dealKeys.myStats(),
    queryFn: getMyDealStats,
    staleTime: 300_000,
  })
}

export function useSalesRepDealStats(salesRepId: string) {
  return useQuery({
    queryKey: dealKeys.salesRepStats(salesRepId),
    queryFn: () => getSalesRepDealStats(salesRepId),
    staleTime: 300_000,
    enabled: !!salesRepId,
  })
}

// ============================================
// Mutation hooks
// ============================================

export function useCreateDeal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateDealRequest) => createDeal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() })
      queryClient.invalidateQueries({ queryKey: dealKeys.stats() })
    },
  })
}

export function useUpdateDeal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDealRequest }) => updateDeal(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: dealKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() })
    },
  })
}

export function useDeleteDeal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteDeal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() })
      queryClient.invalidateQueries({ queryKey: dealKeys.stats() })
    },
  })
}

export function useAdvanceDeal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => advanceDeal(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: dealKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() })
      queryClient.invalidateQueries({ queryKey: dealKeys.stats() })
    },
  })
}

export function useQualifyDeal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => qualifyDeal(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: dealKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() })
      queryClient.invalidateQueries({ queryKey: dealKeys.stats() })
    },
  })
}

export function useSendProposal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => sendProposal(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: dealKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() })
    },
  })
}

export function useStartNegotiation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => startNegotiation(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: dealKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() })
    },
  })
}

export function useConvertDeal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ConvertDealRequest }) => convertDeal(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: dealKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() })
      queryClient.invalidateQueries({ queryKey: dealKeys.stats() })
    },
  })
}

export function useLoseDeal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: LoseDealRequest }) => loseDeal(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: dealKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() })
      queryClient.invalidateQueries({ queryKey: dealKeys.stats() })
    },
  })
}

export function useReopenDeal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => reopenDeal(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: dealKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() })
      queryClient.invalidateQueries({ queryKey: dealKeys.stats() })
    },
  })
}

export function useReassignDeal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReassignDealRequest }) =>
      reassignDeal(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: dealKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() })
    },
  })
}
