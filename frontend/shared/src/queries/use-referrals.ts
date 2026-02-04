"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getReferralConfig,
  updateReferralConfig,
  enableReferralProgram,
  disableReferralProgram,
  getReferralCodes,
  getReferralCodeByMember,
  activateReferralCode,
  deactivateReferralCode,
  getReferrals,
  getReferral,
  getReferralRewards,
  getRewards,
  distributeReward,
  cancelReward,
  processPendingRewards,
  getReferralAnalytics,
  getReferralLeaderboard,
  getMyReferralCode,
  getMyReferrals,
  getMyReferralStats,
  getMyReferralRewards,
  validateReferralCode,
  getReferralCodeInfo,
  type ReferralQueryParams,
  type RewardQueryParams,
} from "../lib/api/referrals";
import type { PaginatedResponse, UUID } from "../types/api";
import type {
  ReferralConfig,
  ReferralCode,
  Referral,
  ReferralReward,
  ReferralStats,
  ReferralAnalytics,
  UpdateReferralConfigRequest,
  ReferralCodeValidation,
} from "../types/referral";

// Query keys
export const referralKeys = {
  all: ["referrals"] as const,
  config: () => [...referralKeys.all, "config"] as const,
  codes: () => [...referralKeys.all, "codes"] as const,
  codeList: (params: ReferralQueryParams) => [...referralKeys.codes(), params] as const,
  codeByMember: (memberId: UUID) => [...referralKeys.codes(), "member", memberId] as const,
  referrals: () => [...referralKeys.all, "list"] as const,
  referralList: (params: ReferralQueryParams) => [...referralKeys.referrals(), params] as const,
  referralDetail: (id: UUID) => [...referralKeys.referrals(), "detail", id] as const,
  referralRewards: (referralId: UUID) => [...referralKeys.referrals(), referralId, "rewards"] as const,
  rewards: () => [...referralKeys.all, "rewards"] as const,
  rewardList: (params: RewardQueryParams) => [...referralKeys.rewards(), params] as const,
  analytics: () => [...referralKeys.all, "analytics"] as const,
  leaderboard: (limit: number) => [...referralKeys.all, "leaderboard", limit] as const,
  myCode: (memberId: UUID) => [...referralKeys.all, "my", "code", memberId] as const,
  myReferrals: (memberId: UUID, params: { page?: number; size?: number }) =>
    [...referralKeys.all, "my", "referrals", memberId, params] as const,
  myStats: (memberId: UUID) => [...referralKeys.all, "my", "stats", memberId] as const,
  myRewards: (memberId: UUID, params: { page?: number; size?: number }) =>
    [...referralKeys.all, "my", "rewards", memberId, params] as const,
  codeValidation: (code: string) => [...referralKeys.all, "validate", code] as const,
  codeInfo: (code: string) => [...referralKeys.all, "info", code] as const,
};

// ============ Config Hooks ============

/**
 * Hook to fetch referral program configuration
 */
export function useReferralConfig(
  options?: Omit<UseQueryOptions<ReferralConfig>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: referralKeys.config(),
    queryFn: () => getReferralConfig(),
    ...options,
  });
}

/**
 * Hook to update referral program configuration
 */
export function useUpdateReferralConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateReferralConfigRequest) => updateReferralConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: referralKeys.config() });
    },
  });
}

/**
 * Hook to enable referral program
 */
export function useEnableReferralProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => enableReferralProgram(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: referralKeys.config() });
    },
  });
}

/**
 * Hook to disable referral program
 */
export function useDisableReferralProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => disableReferralProgram(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: referralKeys.config() });
    },
  });
}

// ============ Code Hooks ============

/**
 * Hook to fetch paginated referral codes
 */
export function useReferralCodes(
  params: ReferralQueryParams = {},
  options?: Omit<UseQueryOptions<PaginatedResponse<ReferralCode>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: referralKeys.codeList(params),
    queryFn: () => getReferralCodes(params),
    ...options,
  });
}

/**
 * Hook to fetch referral code by member ID
 */
export function useReferralCodeByMember(
  memberId: UUID,
  options?: Omit<UseQueryOptions<ReferralCode>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: referralKeys.codeByMember(memberId),
    queryFn: () => getReferralCodeByMember(memberId),
    enabled: !!memberId,
    ...options,
  });
}

/**
 * Hook to activate a referral code
 */
export function useActivateReferralCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => activateReferralCode(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: referralKeys.codes() });
    },
  });
}

/**
 * Hook to deactivate a referral code
 */
export function useDeactivateReferralCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => deactivateReferralCode(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: referralKeys.codes() });
    },
  });
}

// ============ Referral Hooks ============

/**
 * Hook to fetch paginated referrals
 */
export function useReferrals(
  params: ReferralQueryParams = {},
  options?: Omit<UseQueryOptions<PaginatedResponse<Referral>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: referralKeys.referralList(params),
    queryFn: () => getReferrals(params),
    ...options,
  });
}

/**
 * Hook to fetch a single referral
 */
export function useReferral(
  id: UUID,
  options?: Omit<UseQueryOptions<Referral>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: referralKeys.referralDetail(id),
    queryFn: () => getReferral(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook to fetch rewards for a referral
 */
export function useReferralRewards(
  referralId: UUID,
  options?: Omit<UseQueryOptions<ReferralReward[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: referralKeys.referralRewards(referralId),
    queryFn: () => getReferralRewards(referralId),
    enabled: !!referralId,
    ...options,
  });
}

// ============ Reward Hooks ============

/**
 * Hook to fetch paginated rewards
 */
export function useRewards(
  params: RewardQueryParams = {},
  options?: Omit<UseQueryOptions<PaginatedResponse<ReferralReward>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: referralKeys.rewardList(params),
    queryFn: () => getRewards(params),
    ...options,
  });
}

/**
 * Hook to distribute a pending reward
 */
export function useDistributeReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => distributeReward(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: referralKeys.rewards() });
      queryClient.invalidateQueries({ queryKey: referralKeys.analytics() });
    },
  });
}

/**
 * Hook to cancel a pending reward
 */
export function useCancelReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => cancelReward(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: referralKeys.rewards() });
      queryClient.invalidateQueries({ queryKey: referralKeys.analytics() });
    },
  });
}

/**
 * Hook to process all pending rewards
 */
export function useProcessPendingRewards() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (batchSize?: number) => processPendingRewards(batchSize),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: referralKeys.rewards() });
      queryClient.invalidateQueries({ queryKey: referralKeys.analytics() });
    },
  });
}

// ============ Analytics Hooks ============

/**
 * Hook to fetch referral analytics
 */
export function useReferralAnalytics(
  options?: Omit<UseQueryOptions<ReferralAnalytics>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: referralKeys.analytics(),
    queryFn: () => getReferralAnalytics(),
    ...options,
  });
}

/**
 * Hook to fetch referral leaderboard
 */
export function useReferralLeaderboard(
  limit: number = 10,
  options?: Omit<UseQueryOptions<ReferralCode[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: referralKeys.leaderboard(limit),
    queryFn: () => getReferralLeaderboard(limit),
    ...options,
  });
}

// ============ Member Hooks ============

/**
 * Hook to get or create my referral code
 */
export function useMyReferralCode(
  memberId: UUID,
  options?: Omit<UseQueryOptions<ReferralCode>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: referralKeys.myCode(memberId),
    queryFn: () => getMyReferralCode(memberId),
    enabled: !!memberId,
    ...options,
  });
}

/**
 * Hook to get my referral history
 */
export function useMyReferrals(
  memberId: UUID,
  params: { page?: number; size?: number } = {},
  options?: Omit<UseQueryOptions<PaginatedResponse<Referral>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: referralKeys.myReferrals(memberId, params),
    queryFn: () => getMyReferrals(memberId, params),
    enabled: !!memberId,
    ...options,
  });
}

/**
 * Hook to get my referral statistics
 */
export function useMyReferralStats(
  memberId: UUID,
  options?: Omit<UseQueryOptions<ReferralStats>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: referralKeys.myStats(memberId),
    queryFn: () => getMyReferralStats(memberId),
    enabled: !!memberId,
    ...options,
  });
}

/**
 * Hook to get my referral rewards
 */
export function useMyReferralRewards(
  memberId: UUID,
  params: { page?: number; size?: number } = {},
  options?: Omit<UseQueryOptions<PaginatedResponse<ReferralReward>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: referralKeys.myRewards(memberId, params),
    queryFn: () => getMyReferralRewards(memberId, params),
    enabled: !!memberId,
    ...options,
  });
}

// ============ Public Hooks ============

/**
 * Hook to validate a referral code
 */
export function useValidateReferralCode(
  code: string,
  options?: Omit<UseQueryOptions<ReferralCodeValidation>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: referralKeys.codeValidation(code),
    queryFn: () => validateReferralCode(code),
    enabled: !!code,
    ...options,
  });
}

/**
 * Hook to get referral code info
 */
export function useReferralCodeInfo(
  code: string,
  options?: Omit<UseQueryOptions<ReferralCodeValidation>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: referralKeys.codeInfo(code),
    queryFn: () => getReferralCodeInfo(code),
    enabled: !!code,
    ...options,
  });
}
