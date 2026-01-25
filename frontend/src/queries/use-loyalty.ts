"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type { UUID } from "@/types/api";
import type {
  MemberPoints,
  LoyaltyConfig,
  LeaderboardEntry,
  EarnPointsRequest,
  RedeemPointsRequest,
  AdjustPointsRequest,
  UpdateLoyaltyConfigRequest,
  PointsTransactionQueryParams,
  LeaderboardQueryParams,
  MembersByTierQueryParams,
  PaginatedPointsTransactions,
  PaginatedMemberPoints,
} from "@/types/loyalty";
import {
  getLoyaltyConfig,
  updateLoyaltyConfig,
  getMemberPoints,
  getMemberPointsTransactions,
  earnPoints,
  redeemPoints,
  adjustPoints,
  getLeaderboard,
  getMembersByTier,
} from "@/lib/api/loyalty";

// Query keys
export const loyaltyKeys = {
  all: ["loyalty"] as const,
  config: () => [...loyaltyKeys.all, "config"] as const,
  leaderboard: (params?: LeaderboardQueryParams) =>
    [...loyaltyKeys.all, "leaderboard", params] as const,
  membersByTier: (params: MembersByTierQueryParams) =>
    [...loyaltyKeys.all, "members", params] as const,
  memberPoints: () => [...loyaltyKeys.all, "member-points"] as const,
  memberPointsDetail: (memberId: UUID) =>
    [...loyaltyKeys.memberPoints(), memberId] as const,
  memberTransactions: (
    memberId: UUID,
    params?: PointsTransactionQueryParams
  ) => [...loyaltyKeys.memberPoints(), memberId, "transactions", params] as const,
};

// ========== Configuration Hooks ==========

export function useLoyaltyConfig(
  options?: Omit<UseQueryOptions<LoyaltyConfig>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: loyaltyKeys.config(),
    queryFn: () => getLoyaltyConfig(),
    ...options,
  });
}

export function useUpdateLoyaltyConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateLoyaltyConfigRequest) => updateLoyaltyConfig(data),
    onSuccess: (updatedConfig) => {
      queryClient.setQueryData(loyaltyKeys.config(), updatedConfig);
    },
  });
}

// ========== Member Points Hooks ==========

export function useMemberPoints(
  memberId: UUID,
  options?: Omit<UseQueryOptions<MemberPoints>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: loyaltyKeys.memberPointsDetail(memberId),
    queryFn: () => getMemberPoints(memberId),
    enabled: !!memberId,
    ...options,
  });
}

export function useMemberPointsTransactions(
  memberId: UUID,
  params: PointsTransactionQueryParams = {},
  options?: Omit<
    UseQueryOptions<PaginatedPointsTransactions>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: loyaltyKeys.memberTransactions(memberId, params),
    queryFn: () => getMemberPointsTransactions(memberId, params),
    enabled: !!memberId,
    ...options,
  });
}

export function useEarnPoints() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      memberId,
      data,
    }: {
      memberId: UUID;
      data: EarnPointsRequest;
    }) => earnPoints(memberId, data),
    onSuccess: (updatedPoints) => {
      queryClient.setQueryData(
        loyaltyKeys.memberPointsDetail(updatedPoints.memberId),
        updatedPoints
      );
      queryClient.invalidateQueries({
        queryKey: loyaltyKeys.memberTransactions(updatedPoints.memberId, {}),
      });
      queryClient.invalidateQueries({
        queryKey: loyaltyKeys.leaderboard(),
      });
    },
  });
}

export function useRedeemPoints() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      memberId,
      data,
    }: {
      memberId: UUID;
      data: RedeemPointsRequest;
    }) => redeemPoints(memberId, data),
    onSuccess: (updatedPoints) => {
      queryClient.setQueryData(
        loyaltyKeys.memberPointsDetail(updatedPoints.memberId),
        updatedPoints
      );
      queryClient.invalidateQueries({
        queryKey: loyaltyKeys.memberTransactions(updatedPoints.memberId, {}),
      });
      queryClient.invalidateQueries({
        queryKey: loyaltyKeys.leaderboard(),
      });
    },
  });
}

export function useAdjustPoints() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      memberId,
      data,
    }: {
      memberId: UUID;
      data: AdjustPointsRequest;
    }) => adjustPoints(memberId, data),
    onSuccess: (updatedPoints) => {
      queryClient.setQueryData(
        loyaltyKeys.memberPointsDetail(updatedPoints.memberId),
        updatedPoints
      );
      queryClient.invalidateQueries({
        queryKey: loyaltyKeys.memberTransactions(updatedPoints.memberId, {}),
      });
      queryClient.invalidateQueries({
        queryKey: loyaltyKeys.leaderboard(),
      });
    },
  });
}

// ========== Leaderboard Hooks ==========

export function useLeaderboard(
  params: LeaderboardQueryParams = {},
  options?: Omit<UseQueryOptions<LeaderboardEntry[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: loyaltyKeys.leaderboard(params),
    queryFn: () => getLeaderboard(params),
    ...options,
  });
}

export function useMembersByTier(
  params: MembersByTierQueryParams,
  options?: Omit<UseQueryOptions<PaginatedMemberPoints>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: loyaltyKeys.membersByTier(params),
    queryFn: () => getMembersByTier(params),
    enabled: !!params.tier,
    ...options,
  });
}
