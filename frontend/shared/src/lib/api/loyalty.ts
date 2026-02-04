import { api } from "./client";
import type { UUID } from "../types/api";
import type {
  MemberPoints,
  PointsTransaction,
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
} from "../types/loyalty";

// ========== Configuration ==========

export async function getLoyaltyConfig(): Promise<LoyaltyConfig> {
  return api.get("api/loyalty/config").json();
}

export async function updateLoyaltyConfig(
  data: UpdateLoyaltyConfigRequest
): Promise<LoyaltyConfig> {
  return api.put("api/loyalty/config", { json: data }).json();
}

// ========== Member Points ==========

export async function getMemberPoints(memberId: UUID): Promise<MemberPoints> {
  return api.get(`api/members/${memberId}/points`).json();
}

export async function getMemberPointsTransactions(
  memberId: UUID,
  params: PointsTransactionQueryParams = {}
): Promise<PaginatedPointsTransactions> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  const query = searchParams.toString();
  const url = query
    ? `api/members/${memberId}/points/transactions?${query}`
    : `api/members/${memberId}/points/transactions`;

  return api.get(url).json();
}

export async function earnPoints(
  memberId: UUID,
  data: EarnPointsRequest
): Promise<MemberPoints> {
  return api.post(`api/members/${memberId}/points/earn`, { json: data }).json();
}

export async function redeemPoints(
  memberId: UUID,
  data: RedeemPointsRequest
): Promise<MemberPoints> {
  return api
    .post(`api/members/${memberId}/points/redeem`, { json: data })
    .json();
}

export async function adjustPoints(
  memberId: UUID,
  data: AdjustPointsRequest
): Promise<MemberPoints> {
  return api
    .post(`api/members/${memberId}/points/adjust`, { json: data })
    .json();
}

// ========== Leaderboard ==========

export async function getLeaderboard(
  params: LeaderboardQueryParams = {}
): Promise<LeaderboardEntry[]> {
  const searchParams = new URLSearchParams();
  if (params.limit !== undefined)
    searchParams.set("limit", String(params.limit));

  const query = searchParams.toString();
  const url = query ? `api/loyalty/leaderboard?${query}` : "api/loyalty/leaderboard";

  return api.get(url).json();
}

export async function getMembersByTier(
  params: MembersByTierQueryParams
): Promise<PaginatedMemberPoints> {
  const searchParams = new URLSearchParams();
  searchParams.set("tier", params.tier);
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  return api.get(`api/loyalty/members?${searchParams.toString()}`).json();
}
