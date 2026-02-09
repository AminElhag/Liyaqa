import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getClubDetail,
  getClubUsers,
  getClubUserStats,
  resetUserPassword,
  getClubEmployees,
  getClubEmployeeStats,
  getClubSubscriptions,
  getClubSubscriptionStats,
  getClubAuditLogs,
  getAuditActions,
  getClubLocations,
  getClubMembershipPlans,
  updateClub,
  activateClub,
  suspendClub,
} from '@/api/endpoints/club-detail'
import type {
  ClubDetailQueryParams,
  ClubAuditLogQueryParams,
  ResetPasswordRequest,
  UpdateClubRequest,
} from '@/types'

// Query key factory
export const clubDetailKeys = {
  all: ['club-detail'] as const,
  detail: (clubId: string) => [...clubDetailKeys.all, clubId] as const,
  users: (clubId: string, filters: ClubDetailQueryParams) =>
    [...clubDetailKeys.all, 'users', clubId, filters] as const,
  userStats: (clubId: string) =>
    [...clubDetailKeys.all, 'user-stats', clubId] as const,
  employees: (clubId: string, filters: ClubDetailQueryParams) =>
    [...clubDetailKeys.all, 'employees', clubId, filters] as const,
  employeeStats: (clubId: string) =>
    [...clubDetailKeys.all, 'employee-stats', clubId] as const,
  subscriptions: (clubId: string, filters: ClubDetailQueryParams) =>
    [...clubDetailKeys.all, 'subscriptions', clubId, filters] as const,
  subscriptionStats: (clubId: string) =>
    [...clubDetailKeys.all, 'subscription-stats', clubId] as const,
  auditLogs: (clubId: string, filters: ClubAuditLogQueryParams) =>
    [...clubDetailKeys.all, 'audit-logs', clubId, filters] as const,
  auditActions: () => [...clubDetailKeys.all, 'audit-actions'] as const,
  locations: (clubId: string, filters: ClubDetailQueryParams) =>
    [...clubDetailKeys.all, 'locations', clubId, filters] as const,
  membershipPlans: (clubId: string, filters: ClubDetailQueryParams) =>
    [...clubDetailKeys.all, 'membership-plans', clubId, filters] as const,
}

// ============================================
// Query hooks
// ============================================

export function useClubDetail(clubId: string) {
  return useQuery({
    queryKey: clubDetailKeys.detail(clubId),
    queryFn: () => getClubDetail(clubId),
    staleTime: 60_000,
    enabled: !!clubId,
  })
}

export function useClubUsers(clubId: string, params: ClubDetailQueryParams = {}) {
  return useQuery({
    queryKey: clubDetailKeys.users(clubId, params),
    queryFn: () => getClubUsers(clubId, params),
    staleTime: 120_000,
    enabled: !!clubId,
  })
}

export function useClubUserStats(clubId: string) {
  return useQuery({
    queryKey: clubDetailKeys.userStats(clubId),
    queryFn: () => getClubUserStats(clubId),
    staleTime: 300_000,
    enabled: !!clubId,
  })
}

export function useClubEmployees(clubId: string, params: ClubDetailQueryParams = {}) {
  return useQuery({
    queryKey: clubDetailKeys.employees(clubId, params),
    queryFn: () => getClubEmployees(clubId, params),
    staleTime: 120_000,
    enabled: !!clubId,
  })
}

export function useClubEmployeeStats(clubId: string) {
  return useQuery({
    queryKey: clubDetailKeys.employeeStats(clubId),
    queryFn: () => getClubEmployeeStats(clubId),
    staleTime: 300_000,
    enabled: !!clubId,
  })
}

export function useClubSubscriptions(clubId: string, params: ClubDetailQueryParams = {}) {
  return useQuery({
    queryKey: clubDetailKeys.subscriptions(clubId, params),
    queryFn: () => getClubSubscriptions(clubId, params),
    staleTime: 120_000,
    enabled: !!clubId,
  })
}

export function useClubSubscriptionStats(clubId: string) {
  return useQuery({
    queryKey: clubDetailKeys.subscriptionStats(clubId),
    queryFn: () => getClubSubscriptionStats(clubId),
    staleTime: 300_000,
    enabled: !!clubId,
  })
}

export function useClubAuditLogs(clubId: string, params: ClubAuditLogQueryParams = {}) {
  return useQuery({
    queryKey: clubDetailKeys.auditLogs(clubId, params),
    queryFn: () => getClubAuditLogs(clubId, params),
    staleTime: 120_000,
    enabled: !!clubId,
  })
}

export function useAuditActions() {
  return useQuery({
    queryKey: clubDetailKeys.auditActions(),
    queryFn: getAuditActions,
    staleTime: 600_000,
  })
}

export function useClubLocations(clubId: string, params: ClubDetailQueryParams = {}) {
  return useQuery({
    queryKey: clubDetailKeys.locations(clubId, params),
    queryFn: () => getClubLocations(clubId, params),
    staleTime: 120_000,
    enabled: !!clubId,
  })
}

export function useClubMembershipPlans(clubId: string, params: ClubDetailQueryParams = {}) {
  return useQuery({
    queryKey: clubDetailKeys.membershipPlans(clubId, params),
    queryFn: () => getClubMembershipPlans(clubId, params),
    staleTime: 120_000,
    enabled: !!clubId,
  })
}

// ============================================
// Mutation hooks
// ============================================

export function useUpdateClub() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ clubId, data }: { clubId: string; data: UpdateClubRequest }) =>
      updateClub(clubId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: clubDetailKeys.detail(variables.clubId),
      })
    },
  })
}

export function useActivateClub() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (clubId: string) => activateClub(clubId),
    onSuccess: (_data, clubId) => {
      queryClient.invalidateQueries({ queryKey: clubDetailKeys.detail(clubId) })
    },
  })
}

export function useSuspendClub() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (clubId: string) => suspendClub(clubId),
    onSuccess: (_data, clubId) => {
      queryClient.invalidateQueries({ queryKey: clubDetailKeys.detail(clubId) })
    },
  })
}

export function useResetUserPassword() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      clubId,
      userId,
      data,
    }: {
      clubId: string
      userId: string
      data: ResetPasswordRequest
    }) => resetUserPassword(clubId, userId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: clubDetailKeys.users(variables.clubId, {}),
      })
    },
  })
}
