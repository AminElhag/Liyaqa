import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createClientPlan,
  getClientPlan,
  getClientPlans,
  getActiveClientPlans,
  updateClientPlan,
  activateClientPlan,
  deactivateClientPlan,
  deleteClientPlan,
} from '@/api/endpoints/client-plans'
import type {
  ClientPlanQueryParams,
  CreateClientPlanRequest,
  UpdateClientPlanRequest,
} from '@/types'

// Query key factory
export const clientPlanKeys = {
  all: ['client-plans'] as const,
  lists: () => [...clientPlanKeys.all, 'list'] as const,
  list: (filters: ClientPlanQueryParams) => [...clientPlanKeys.lists(), filters] as const,
  active: () => [...clientPlanKeys.all, 'active'] as const,
  details: () => [...clientPlanKeys.all, 'detail'] as const,
  detail: (id: string) => [...clientPlanKeys.details(), id] as const,
}

// ============================================
// Query hooks
// ============================================

export function useClientPlans(params: ClientPlanQueryParams = {}) {
  return useQuery({
    queryKey: clientPlanKeys.list(params),
    queryFn: () => getClientPlans(params),
    staleTime: 120_000,
  })
}

export function useClientPlan(id: string) {
  return useQuery({
    queryKey: clientPlanKeys.detail(id),
    queryFn: () => getClientPlan(id),
    staleTime: 60_000,
    enabled: !!id,
  })
}

export function useActiveClientPlans() {
  return useQuery({
    queryKey: clientPlanKeys.active(),
    queryFn: getActiveClientPlans,
    staleTime: 600_000,
  })
}

// ============================================
// Mutation hooks
// ============================================

export function useCreateClientPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateClientPlanRequest) => createClientPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientPlanKeys.lists() })
      queryClient.invalidateQueries({ queryKey: clientPlanKeys.active() })
    },
  })
}

export function useUpdateClientPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClientPlanRequest }) =>
      updateClientPlan(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: clientPlanKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: clientPlanKeys.lists() })
      queryClient.invalidateQueries({ queryKey: clientPlanKeys.active() })
    },
  })
}

export function useActivateClientPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => activateClientPlan(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: clientPlanKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: clientPlanKeys.lists() })
      queryClient.invalidateQueries({ queryKey: clientPlanKeys.active() })
    },
  })
}

export function useDeactivateClientPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deactivateClientPlan(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: clientPlanKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: clientPlanKeys.lists() })
      queryClient.invalidateQueries({ queryKey: clientPlanKeys.active() })
    },
  })
}

export function useDeleteClientPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteClientPlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientPlanKeys.lists() })
      queryClient.invalidateQueries({ queryKey: clientPlanKeys.active() })
    },
  })
}
