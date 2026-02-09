import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getClientOverview,
  getClientMembers,
  getMemberDetail,
  getSupportClientSubscriptions,
  getSupportClientInvoices,
  getClientUsers,
  impersonateUser,
  endImpersonation,
  getActiveSessions,
  forceEndSession,
} from '@/api/endpoints/support'
import type {
  SupportMemberQueryParams,
  SupportSubscriptionQueryParams,
  SupportInvoiceQueryParams,
  SupportUserQueryParams,
} from '@/types'

// Query key factory
export const platformSupportKeys = {
  all: ['platform-support'] as const,
  overview: (organizationId: string) =>
    [...platformSupportKeys.all, 'overview', organizationId] as const,
  members: (organizationId: string, clubId: string, filters: SupportMemberQueryParams) =>
    [...platformSupportKeys.all, 'members', organizationId, clubId, filters] as const,
  memberDetail: (organizationId: string, clubId: string, memberId: string) =>
    [...platformSupportKeys.all, 'member-detail', organizationId, clubId, memberId] as const,
  subscriptions: (
    organizationId: string,
    clubId: string,
    filters: SupportSubscriptionQueryParams,
  ) =>
    [...platformSupportKeys.all, 'subscriptions', organizationId, clubId, filters] as const,
  invoices: (organizationId: string, clubId: string, filters: SupportInvoiceQueryParams) =>
    [...platformSupportKeys.all, 'invoices', organizationId, clubId, filters] as const,
  users: (organizationId: string, clubId: string, filters: SupportUserQueryParams) =>
    [...platformSupportKeys.all, 'users', organizationId, clubId, filters] as const,
  sessions: () => [...platformSupportKeys.all, 'sessions'] as const,
}

// ============================================
// Query hooks
// ============================================

export function useClientOverview(organizationId: string) {
  return useQuery({
    queryKey: platformSupportKeys.overview(organizationId),
    queryFn: () => getClientOverview(organizationId),
    staleTime: 120_000,
    enabled: !!organizationId,
  })
}

export function useClientMembers(
  organizationId: string,
  clubId: string,
  params: SupportMemberQueryParams = {},
) {
  return useQuery({
    queryKey: platformSupportKeys.members(organizationId, clubId, params),
    queryFn: () => getClientMembers(organizationId, clubId, params),
    staleTime: 120_000,
    enabled: !!organizationId && !!clubId,
  })
}

export function useMemberDetail(
  organizationId: string,
  clubId: string,
  memberId: string,
) {
  return useQuery({
    queryKey: platformSupportKeys.memberDetail(organizationId, clubId, memberId),
    queryFn: () => getMemberDetail(organizationId, clubId, memberId),
    staleTime: 60_000,
    enabled: !!organizationId && !!clubId && !!memberId,
  })
}

export function useSupportClientSubscriptions(
  organizationId: string,
  clubId: string,
  params: SupportSubscriptionQueryParams = {},
) {
  return useQuery({
    queryKey: platformSupportKeys.subscriptions(organizationId, clubId, params),
    queryFn: () => getSupportClientSubscriptions(organizationId, clubId, params),
    staleTime: 120_000,
    enabled: !!organizationId && !!clubId,
  })
}

export function useSupportClientInvoices(
  organizationId: string,
  clubId: string,
  params: SupportInvoiceQueryParams = {},
) {
  return useQuery({
    queryKey: platformSupportKeys.invoices(organizationId, clubId, params),
    queryFn: () => getSupportClientInvoices(organizationId, clubId, params),
    staleTime: 120_000,
    enabled: !!organizationId && !!clubId,
  })
}

export function useSupportClientUsers(
  organizationId: string,
  clubId: string,
  params: SupportUserQueryParams = {},
) {
  return useQuery({
    queryKey: platformSupportKeys.users(organizationId, clubId, params),
    queryFn: () => getClientUsers(organizationId, clubId, params),
    staleTime: 120_000,
    enabled: !!organizationId && !!clubId,
  })
}

export function useActiveSessions() {
  return useQuery({
    queryKey: platformSupportKeys.sessions(),
    queryFn: getActiveSessions,
    staleTime: 60_000,
  })
}

// ============================================
// Mutation hooks
// ============================================

export function useImpersonateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      impersonateUser(userId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformSupportKeys.sessions() })
    },
  })
}

export function useEndImpersonation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => endImpersonation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformSupportKeys.sessions() })
    },
  })
}

export function useForceEndSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (sessionId: string) => forceEndSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformSupportKeys.sessions() })
    },
  })
}
