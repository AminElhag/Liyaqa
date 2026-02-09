import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createPlatformUser,
  getPlatformUser,
  getPlatformUsers,
  getPlatformUserStats,
  updatePlatformUser,
  changePlatformUserStatus,
  resetPlatformUserPassword,
  getPlatformUserActivities,
  deletePlatformUser,
} from '@/api/endpoints/platform-users'
import type {
  PlatformUserQueryParams,
  CreatePlatformUserRequest,
  UpdatePlatformUserRequest,
  ChangeUserStatusRequest,
  ResetUserPasswordRequest,
} from '@/types'

// Query key factory
export const platformUserKeys = {
  all: ['platform-users'] as const,
  lists: () => [...platformUserKeys.all, 'list'] as const,
  list: (filters: PlatformUserQueryParams) =>
    [...platformUserKeys.lists(), filters] as const,
  details: () => [...platformUserKeys.all, 'detail'] as const,
  detail: (id: string) => [...platformUserKeys.details(), id] as const,
  stats: () => [...platformUserKeys.all, 'stats'] as const,
  activities: (id: string, filters: { page?: number; size?: number }) =>
    [...platformUserKeys.all, 'activities', id, filters] as const,
}

// ============================================
// Query hooks
// ============================================

export function usePlatformUsers(params: PlatformUserQueryParams = {}) {
  return useQuery({
    queryKey: platformUserKeys.list(params),
    queryFn: () => getPlatformUsers(params),
    staleTime: 120_000,
  })
}

export function usePlatformUser(id: string) {
  return useQuery({
    queryKey: platformUserKeys.detail(id),
    queryFn: () => getPlatformUser(id),
    staleTime: 60_000,
    enabled: !!id,
  })
}

export function usePlatformUserStats() {
  return useQuery({
    queryKey: platformUserKeys.stats(),
    queryFn: getPlatformUserStats,
    staleTime: 300_000,
  })
}

export function usePlatformUserActivities(
  id: string,
  params: { page?: number; size?: number } = {},
) {
  return useQuery({
    queryKey: platformUserKeys.activities(id, params),
    queryFn: () => getPlatformUserActivities(id, params),
    staleTime: 60_000,
    enabled: !!id,
  })
}

// ============================================
// Mutation hooks
// ============================================

export function useCreatePlatformUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreatePlatformUserRequest) => createPlatformUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformUserKeys.lists() })
      queryClient.invalidateQueries({ queryKey: platformUserKeys.stats() })
    },
  })
}

export function useUpdatePlatformUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePlatformUserRequest }) =>
      updatePlatformUser(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: platformUserKeys.detail(variables.id),
      })
      queryClient.invalidateQueries({ queryKey: platformUserKeys.lists() })
    },
  })
}

export function useChangePlatformUserStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ChangeUserStatusRequest }) =>
      changePlatformUserStatus(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: platformUserKeys.detail(variables.id),
      })
      queryClient.invalidateQueries({ queryKey: platformUserKeys.lists() })
      queryClient.invalidateQueries({ queryKey: platformUserKeys.stats() })
    },
  })
}

export function useResetPlatformUserPassword() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ResetUserPasswordRequest }) =>
      resetPlatformUserPassword(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: platformUserKeys.detail(variables.id),
      })
    },
  })
}

export function useDeletePlatformUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deletePlatformUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformUserKeys.lists() })
      queryClient.invalidateQueries({ queryKey: platformUserKeys.stats() })
    },
  })
}
