import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  onboardClient,
  getClient,
  getClients,
  getClientStats,
  activateClient,
  suspendClient,
  setupAdmin,
  getClientClubs,
  createClientClub,
  getClientHealth,
} from '@/api/endpoints/clients'
import type {
  ClientQueryParams,
  OnboardClientRequest,
  SetupAdminRequest,
  CreateClientClubRequest,
} from '@/types'

// Query key factory
export const clientKeys = {
  all: ['clients'] as const,
  lists: () => [...clientKeys.all, 'list'] as const,
  list: (filters: ClientQueryParams) => [...clientKeys.lists(), filters] as const,
  details: () => [...clientKeys.all, 'detail'] as const,
  detail: (id: string) => [...clientKeys.details(), id] as const,
  stats: () => [...clientKeys.all, 'stats'] as const,
  clubs: (organizationId: string) =>
    [...clientKeys.all, 'clubs', organizationId] as const,
  health: (id: string) => [...clientKeys.all, 'health', id] as const,
}

// ============================================
// Query hooks
// ============================================

export function useClients(params: ClientQueryParams = {}) {
  return useQuery({
    queryKey: clientKeys.list(params),
    queryFn: () => getClients(params),
    staleTime: 120_000,
  })
}

export function useClient(id: string) {
  return useQuery({
    queryKey: clientKeys.detail(id),
    queryFn: () => getClient(id),
    staleTime: 60_000,
    enabled: !!id,
  })
}

export function useClientStats() {
  return useQuery({
    queryKey: clientKeys.stats(),
    queryFn: getClientStats,
    staleTime: 300_000,
  })
}

export function useClientClubs(
  organizationId: string,
  queryParams: { page?: number; size?: number } = {},
) {
  return useQuery({
    queryKey: [...clientKeys.clubs(organizationId), queryParams] as const,
    queryFn: () => getClientClubs(organizationId, queryParams),
    staleTime: 120_000,
    enabled: !!organizationId,
  })
}

export function useClientHealthIndicators(id: string) {
  return useQuery({
    queryKey: clientKeys.health(id),
    queryFn: () => getClientHealth(id),
    staleTime: 300_000,
    enabled: !!id,
  })
}

// ============================================
// Mutation hooks
// ============================================

export function useOnboardClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: OnboardClientRequest) => onboardClient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() })
      queryClient.invalidateQueries({ queryKey: clientKeys.stats() })
    },
  })
}

export function useActivateClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => activateClient(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() })
      queryClient.invalidateQueries({ queryKey: clientKeys.stats() })
    },
  })
}

export function useSuspendClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => suspendClient(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() })
      queryClient.invalidateQueries({ queryKey: clientKeys.stats() })
    },
  })
}

export function useSetupAdmin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      organizationId,
      data,
    }: {
      organizationId: string
      data: SetupAdminRequest
    }) => setupAdmin(organizationId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: clientKeys.detail(variables.organizationId),
      })
    },
  })
}

export function useCreateClientClub() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      organizationId,
      data,
    }: {
      organizationId: string
      data: CreateClientClubRequest
    }) => createClientClub(organizationId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: clientKeys.clubs(variables.organizationId),
      })
    },
  })
}
