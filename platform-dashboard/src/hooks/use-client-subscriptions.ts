import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createClientSubscription,
  getClientSubscription,
  getClientSubscriptions,
  getSubscriptionsByOrganization,
  updateClientSubscription,
  activateClientSubscription,
  suspendClientSubscription,
  cancelClientSubscription,
  changeSubscriptionPlan,
  renewSubscription,
  getSubscriptionStats,
} from '@/api/endpoints/client-subscriptions'
import type {
  ClientSubscriptionQueryParams,
  CreateClientSubscriptionRequest,
  UpdateClientSubscriptionRequest,
  ChangeSubscriptionPlanRequest,
  RenewSubscriptionRequest,
} from '@/types'

// Query key factory
export const clientSubscriptionKeys = {
  all: ['client-subscriptions'] as const,
  lists: () => [...clientSubscriptionKeys.all, 'list'] as const,
  list: (filters: ClientSubscriptionQueryParams) =>
    [...clientSubscriptionKeys.lists(), filters] as const,
  byOrganization: (organizationId: string, filters: ClientSubscriptionQueryParams) =>
    [...clientSubscriptionKeys.lists(), 'org', organizationId, filters] as const,
  details: () => [...clientSubscriptionKeys.all, 'detail'] as const,
  detail: (id: string) => [...clientSubscriptionKeys.details(), id] as const,
  stats: () => [...clientSubscriptionKeys.all, 'stats'] as const,
}

// ============================================
// Query hooks
// ============================================

export function useClientSubscriptions(params: ClientSubscriptionQueryParams = {}) {
  return useQuery({
    queryKey: clientSubscriptionKeys.list(params),
    queryFn: () => getClientSubscriptions(params),
    staleTime: 120_000,
  })
}

export function useClientSubscription(id: string) {
  return useQuery({
    queryKey: clientSubscriptionKeys.detail(id),
    queryFn: () => getClientSubscription(id),
    staleTime: 60_000,
    enabled: !!id,
  })
}

export function useSubscriptionsByOrganization(
  organizationId: string,
  params: ClientSubscriptionQueryParams = {},
) {
  return useQuery({
    queryKey: clientSubscriptionKeys.byOrganization(organizationId, params),
    queryFn: () => getSubscriptionsByOrganization(organizationId, params),
    staleTime: 120_000,
    enabled: !!organizationId,
  })
}

export function useSubscriptionStats() {
  return useQuery({
    queryKey: clientSubscriptionKeys.stats(),
    queryFn: getSubscriptionStats,
    staleTime: 300_000,
  })
}

// ============================================
// Mutation hooks
// ============================================

export function useCreateClientSubscription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateClientSubscriptionRequest) => createClientSubscription(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientSubscriptionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: clientSubscriptionKeys.stats() })
    },
  })
}

export function useUpdateClientSubscription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClientSubscriptionRequest }) =>
      updateClientSubscription(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: clientSubscriptionKeys.detail(variables.id),
      })
      queryClient.invalidateQueries({ queryKey: clientSubscriptionKeys.lists() })
    },
  })
}

export function useActivateClientSubscription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => activateClientSubscription(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: clientSubscriptionKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: clientSubscriptionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: clientSubscriptionKeys.stats() })
    },
  })
}

export function useSuspendClientSubscription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => suspendClientSubscription(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: clientSubscriptionKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: clientSubscriptionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: clientSubscriptionKeys.stats() })
    },
  })
}

export function useCancelClientSubscription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => cancelClientSubscription(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: clientSubscriptionKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: clientSubscriptionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: clientSubscriptionKeys.stats() })
    },
  })
}

export function useChangeSubscriptionPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ChangeSubscriptionPlanRequest }) =>
      changeSubscriptionPlan(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: clientSubscriptionKeys.detail(variables.id),
      })
      queryClient.invalidateQueries({ queryKey: clientSubscriptionKeys.lists() })
    },
  })
}

export function useRenewSubscription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RenewSubscriptionRequest }) =>
      renewSubscription(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: clientSubscriptionKeys.detail(variables.id),
      })
      queryClient.invalidateQueries({ queryKey: clientSubscriptionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: clientSubscriptionKeys.stats() })
    },
  })
}
