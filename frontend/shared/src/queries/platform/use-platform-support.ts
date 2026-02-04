"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
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
} from "../../lib/api/platform/support";
import type { PageResponse, UUID } from "../../types/api";
import type {
  ClientSupportOverview,
  ClientMemberSummary,
  ClientMemberDetail,
  ClientMemberSubscription,
  ClientMemberInvoice,
  ClientUser,
  ImpersonationResponse,
  ImpersonationSession,
  SupportMemberQueryParams,
  SupportSubscriptionQueryParams,
  SupportInvoiceQueryParams,
  SupportUserQueryParams,
} from "../../types/platform";

// Query keys
export const platformSupportKeys = {
  all: ["platform", "support"] as const,
  clientOverview: (organizationId: UUID) =>
    [...platformSupportKeys.all, "overview", organizationId] as const,
  members: (organizationId: UUID, clubId: UUID) =>
    [...platformSupportKeys.all, organizationId, clubId, "members"] as const,
  memberDetail: (organizationId: UUID, clubId: UUID, memberId: UUID) =>
    [...platformSupportKeys.members(organizationId, clubId), memberId] as const,
  subscriptions: (organizationId: UUID, clubId: UUID) =>
    [...platformSupportKeys.all, organizationId, clubId, "subscriptions"] as const,
  invoices: (organizationId: UUID, clubId: UUID) =>
    [...platformSupportKeys.all, organizationId, clubId, "invoices"] as const,
  users: (organizationId: UUID, clubId: UUID) =>
    [...platformSupportKeys.all, organizationId, clubId, "users"] as const,
  impersonationSessions: () =>
    [...platformSupportKeys.all, "impersonation", "sessions"] as const,
};

/**
 * Hook to fetch client overview for support
 */
export function useClientOverview(
  organizationId: UUID,
  options?: Omit<UseQueryOptions<ClientSupportOverview>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: platformSupportKeys.clientOverview(organizationId),
    queryFn: () => getClientOverview(organizationId),
    enabled: !!organizationId,
    ...options,
  });
}

/**
 * Hook to fetch client members
 */
export function useClientMembers(
  organizationId: UUID,
  clubId: UUID,
  params: SupportMemberQueryParams = {},
  options?: Omit<
    UseQueryOptions<PageResponse<ClientMemberSummary>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: platformSupportKeys.members(organizationId, clubId),
    queryFn: () => getClientMembers(organizationId, clubId, params),
    enabled: !!organizationId && !!clubId,
    ...options,
  });
}

/**
 * Hook to fetch member detail
 */
export function useMemberDetail(
  organizationId: UUID,
  clubId: UUID,
  memberId: UUID,
  options?: Omit<UseQueryOptions<ClientMemberDetail>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: platformSupportKeys.memberDetail(organizationId, clubId, memberId),
    queryFn: () => getMemberDetail(organizationId, clubId, memberId),
    enabled: !!organizationId && !!clubId && !!memberId,
    ...options,
  });
}

/**
 * Hook to fetch client subscriptions
 */
export function useSupportClientSubscriptions(
  organizationId: UUID,
  clubId: UUID,
  params: SupportSubscriptionQueryParams = {},
  options?: Omit<
    UseQueryOptions<PageResponse<ClientMemberSubscription>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: platformSupportKeys.subscriptions(organizationId, clubId),
    queryFn: () => getSupportClientSubscriptions(organizationId, clubId, params),
    enabled: !!organizationId && !!clubId,
    ...options,
  });
}

/**
 * Hook to fetch client invoices
 */
export function useSupportClientInvoices(
  organizationId: UUID,
  clubId: UUID,
  params: SupportInvoiceQueryParams = {},
  options?: Omit<
    UseQueryOptions<PageResponse<ClientMemberInvoice>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: platformSupportKeys.invoices(organizationId, clubId),
    queryFn: () => getSupportClientInvoices(organizationId, clubId, params),
    enabled: !!organizationId && !!clubId,
    ...options,
  });
}

/**
 * Hook to fetch client users
 */
export function useSupportClientUsers(
  organizationId: UUID,
  clubId: UUID,
  params: SupportUserQueryParams = {},
  options?: Omit<
    UseQueryOptions<PageResponse<ClientUser>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: platformSupportKeys.users(organizationId, clubId),
    queryFn: () => getClientUsers(organizationId, clubId, params),
    enabled: !!organizationId && !!clubId,
    ...options,
  });
}

/**
 * Hook to fetch active impersonation sessions (PLATFORM_ADMIN only)
 */
export function useActiveSessions(
  options?: Omit<UseQueryOptions<ImpersonationSession[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: platformSupportKeys.impersonationSessions(),
    queryFn: () => getActiveSessions(),
    ...options,
  });
}

/**
 * Hook to impersonate a user
 */
export function useImpersonate() {
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: UUID; reason: string }) =>
      impersonateUser(userId, reason),
  });
}

/**
 * Hook to end impersonation session
 */
export function useEndImpersonation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => endImpersonation(),
    onSuccess: () => {
      // Clear all platform queries when ending impersonation
      queryClient.invalidateQueries({ queryKey: ["platform"] });
    },
  });
}

/**
 * Hook to force end an impersonation session (PLATFORM_ADMIN only)
 */
export function useForceEndSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: UUID) => forceEndSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: platformSupportKeys.impersonationSessions(),
      });
    },
  });
}
