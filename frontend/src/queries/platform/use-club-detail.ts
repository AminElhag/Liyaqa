"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
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
} from "@/lib/api/platform/club-detail";
import type { PageResponse, UUID } from "@/types/api";
import type {
  PlatformClubDetail,
  ClubUser,
  ClubUserStats,
  ClubEmployee,
  ClubEmployeeStats,
  ClubSubscription,
  ClubSubscriptionStats,
  ClubAuditLog,
  ClubDetailQueryParams,
  ClubAuditLogQueryParams,
  ResetPasswordRequest,
} from "@/types/platform";

// ============================================
// Query Keys
// ============================================

export const platformClubKeys = {
  all: ["platform", "clubs"] as const,
  detail: (clubId: UUID) => [...platformClubKeys.all, clubId] as const,
  users: (clubId: UUID) => [...platformClubKeys.all, clubId, "users"] as const,
  usersList: (clubId: UUID, params: ClubDetailQueryParams) =>
    [...platformClubKeys.users(clubId), "list", params] as const,
  usersStats: (clubId: UUID) => [...platformClubKeys.users(clubId), "stats"] as const,
  employees: (clubId: UUID) => [...platformClubKeys.all, clubId, "employees"] as const,
  employeesList: (clubId: UUID, params: ClubDetailQueryParams) =>
    [...platformClubKeys.employees(clubId), "list", params] as const,
  employeesStats: (clubId: UUID) => [...platformClubKeys.employees(clubId), "stats"] as const,
  subscriptions: (clubId: UUID) => [...platformClubKeys.all, clubId, "subscriptions"] as const,
  subscriptionsList: (clubId: UUID, params: ClubDetailQueryParams) =>
    [...platformClubKeys.subscriptions(clubId), "list", params] as const,
  subscriptionsStats: (clubId: UUID) => [...platformClubKeys.subscriptions(clubId), "stats"] as const,
  auditLogs: (clubId: UUID) => [...platformClubKeys.all, clubId, "audit-logs"] as const,
  auditLogsList: (clubId: UUID, params: ClubAuditLogQueryParams) =>
    [...platformClubKeys.auditLogs(clubId), "list", params] as const,
  auditActions: () => [...platformClubKeys.all, "audit-actions"] as const,
};

// ============================================
// Club Detail Hook
// ============================================

/**
 * Hook to fetch club details with statistics
 */
export function useClubDetail(
  clubId: UUID,
  options?: Omit<UseQueryOptions<PlatformClubDetail>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: platformClubKeys.detail(clubId),
    queryFn: () => getClubDetail(clubId),
    enabled: !!clubId,
    ...options,
  });
}

// ============================================
// Club Users Hooks
// ============================================

/**
 * Hook to fetch users for a club
 */
export function useClubUsers(
  clubId: UUID,
  params: ClubDetailQueryParams = {},
  options?: Omit<UseQueryOptions<PageResponse<ClubUser>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: platformClubKeys.usersList(clubId, params),
    queryFn: () => getClubUsers(clubId, params),
    enabled: !!clubId,
    ...options,
  });
}

/**
 * Hook to fetch user statistics for a club
 */
export function useClubUserStats(
  clubId: UUID,
  options?: Omit<UseQueryOptions<ClubUserStats>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: platformClubKeys.usersStats(clubId),
    queryFn: () => getClubUserStats(clubId),
    enabled: !!clubId,
    ...options,
  });
}

/**
 * Hook to reset a user's password
 */
export function useResetUserPassword(clubId: UUID) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: UUID; data: ResetPasswordRequest }) =>
      resetUserPassword(clubId, userId, data),
    onSuccess: () => {
      // Invalidate users list to refresh
      queryClient.invalidateQueries({ queryKey: platformClubKeys.users(clubId) });
    },
  });
}

// ============================================
// Club Employees Hooks
// ============================================

/**
 * Hook to fetch employees for a club
 */
export function useClubEmployees(
  clubId: UUID,
  params: ClubDetailQueryParams = {},
  options?: Omit<UseQueryOptions<PageResponse<ClubEmployee>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: platformClubKeys.employeesList(clubId, params),
    queryFn: () => getClubEmployees(clubId, params),
    enabled: !!clubId,
    ...options,
  });
}

/**
 * Hook to fetch employee statistics for a club
 */
export function useClubEmployeeStats(
  clubId: UUID,
  options?: Omit<UseQueryOptions<ClubEmployeeStats>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: platformClubKeys.employeesStats(clubId),
    queryFn: () => getClubEmployeeStats(clubId),
    enabled: !!clubId,
    ...options,
  });
}

// ============================================
// Club Subscriptions Hooks
// ============================================

/**
 * Hook to fetch subscriptions for a club
 */
export function useClubSubscriptions(
  clubId: UUID,
  params: ClubDetailQueryParams = {},
  options?: Omit<UseQueryOptions<PageResponse<ClubSubscription>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: platformClubKeys.subscriptionsList(clubId, params),
    queryFn: () => getClubSubscriptions(clubId, params),
    enabled: !!clubId,
    ...options,
  });
}

/**
 * Hook to fetch subscription statistics for a club
 */
export function useClubSubscriptionStats(
  clubId: UUID,
  options?: Omit<UseQueryOptions<ClubSubscriptionStats>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: platformClubKeys.subscriptionsStats(clubId),
    queryFn: () => getClubSubscriptionStats(clubId),
    enabled: !!clubId,
    ...options,
  });
}

// ============================================
// Club Audit Logs Hooks
// ============================================

/**
 * Hook to fetch audit logs for a club
 */
export function useClubAuditLogs(
  clubId: UUID,
  params: ClubAuditLogQueryParams = {},
  options?: Omit<UseQueryOptions<PageResponse<ClubAuditLog>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: platformClubKeys.auditLogsList(clubId, params),
    queryFn: () => getClubAuditLogs(clubId, params),
    enabled: !!clubId,
    ...options,
  });
}

/**
 * Hook to fetch available audit actions
 */
export function useAuditActions(
  options?: Omit<UseQueryOptions<string[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: platformClubKeys.auditActions(),
    queryFn: () => getAuditActions(),
    staleTime: Infinity, // Actions don't change
    ...options,
  });
}
