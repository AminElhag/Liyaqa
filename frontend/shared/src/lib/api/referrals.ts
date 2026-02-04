import { api } from "./client";
import type { PaginatedResponse, UUID } from "../types/api";
import type {
  ReferralConfig,
  ReferralCode,
  Referral,
  ReferralReward,
  ReferralStats,
  ReferralAnalytics,
  UpdateReferralConfigRequest,
  ReferralStatus,
  RewardStatus,
  ReferralCodeValidation,
  ReferralTrackResponse,
} from "../types/referral";

export interface ReferralQueryParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  status?: ReferralStatus;
}

export interface RewardQueryParams {
  page?: number;
  size?: number;
  status?: RewardStatus;
}

// ============ Config ============

/**
 * Get referral program configuration
 */
export async function getReferralConfig(): Promise<ReferralConfig> {
  return api.get("api/referral/config").json();
}

/**
 * Update referral program configuration
 */
export async function updateReferralConfig(
  data: UpdateReferralConfigRequest
): Promise<ReferralConfig> {
  return api.put("api/referral/config", { json: data }).json();
}

/**
 * Enable referral program
 */
export async function enableReferralProgram(): Promise<ReferralConfig> {
  return api.post("api/referral/config/enable").json();
}

/**
 * Disable referral program
 */
export async function disableReferralProgram(): Promise<ReferralConfig> {
  return api.post("api/referral/config/disable").json();
}

// ============ Codes ============

/**
 * Get paginated referral codes
 */
export async function getReferralCodes(
  params: ReferralQueryParams = {}
): Promise<PaginatedResponse<ReferralCode>> {
  const searchParams = new URLSearchParams();

  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortDir) searchParams.set("sortDir", params.sortDir);

  const queryString = searchParams.toString();
  const url = queryString ? `api/referral/codes?${queryString}` : "api/referral/codes";

  return api.get(url).json();
}

/**
 * Get referral code by member ID
 */
export async function getReferralCodeByMember(memberId: UUID): Promise<ReferralCode> {
  return api.get(`api/referral/codes/${memberId}`).json();
}

/**
 * Activate a referral code
 */
export async function activateReferralCode(id: UUID): Promise<ReferralCode> {
  return api.post(`api/referral/codes/${id}/activate`).json();
}

/**
 * Deactivate a referral code
 */
export async function deactivateReferralCode(id: UUID): Promise<ReferralCode> {
  return api.post(`api/referral/codes/${id}/deactivate`).json();
}

// ============ Referrals ============

/**
 * Get paginated referrals
 */
export async function getReferrals(
  params: ReferralQueryParams = {}
): Promise<PaginatedResponse<Referral>> {
  const searchParams = new URLSearchParams();

  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.status) searchParams.set("status", params.status);

  const queryString = searchParams.toString();
  const url = queryString ? `api/referral/referrals?${queryString}` : "api/referral/referrals";

  return api.get(url).json();
}

/**
 * Get referral by ID
 */
export async function getReferral(id: UUID): Promise<Referral> {
  return api.get(`api/referral/referrals/${id}`).json();
}

/**
 * Get rewards for a referral
 */
export async function getReferralRewards(referralId: UUID): Promise<ReferralReward[]> {
  return api.get(`api/referral/referrals/${referralId}/rewards`).json();
}

// ============ Rewards ============

/**
 * Get paginated rewards
 */
export async function getRewards(
  params: RewardQueryParams = {}
): Promise<PaginatedResponse<ReferralReward>> {
  const searchParams = new URLSearchParams();

  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.status) searchParams.set("status", params.status);

  const queryString = searchParams.toString();
  const url = queryString ? `api/referral/rewards?${queryString}` : "api/referral/rewards";

  return api.get(url).json();
}

/**
 * Distribute a pending reward
 */
export async function distributeReward(id: UUID): Promise<ReferralReward> {
  return api.post(`api/referral/rewards/${id}/distribute`).json();
}

/**
 * Cancel a pending reward
 */
export async function cancelReward(id: UUID): Promise<ReferralReward> {
  return api.post(`api/referral/rewards/${id}/cancel`).json();
}

/**
 * Process all pending rewards
 */
export async function processPendingRewards(
  batchSize: number = 100
): Promise<{ processed: number }> {
  return api.post(`api/referral/rewards/process-pending?batchSize=${batchSize}`).json();
}

// ============ Analytics ============

/**
 * Get referral analytics
 */
export async function getReferralAnalytics(): Promise<ReferralAnalytics> {
  return api.get("api/referral/analytics").json();
}

/**
 * Get top referrers leaderboard
 */
export async function getReferralLeaderboard(limit: number = 10): Promise<ReferralCode[]> {
  return api.get(`api/referral/leaderboard?limit=${limit}`).json();
}

// ============ Member Endpoints ============

/**
 * Get or create my referral code
 */
export async function getMyReferralCode(memberId: UUID): Promise<ReferralCode> {
  return api.get(`api/referral/my-code?memberId=${memberId}`).json();
}

/**
 * Get my referral history
 */
export async function getMyReferrals(
  memberId: UUID,
  params: { page?: number; size?: number } = {}
): Promise<PaginatedResponse<Referral>> {
  const searchParams = new URLSearchParams();
  searchParams.set("memberId", memberId);
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  return api.get(`api/referral/my-referrals?${searchParams.toString()}`).json();
}

/**
 * Get my referral statistics
 */
export async function getMyReferralStats(memberId: UUID): Promise<ReferralStats> {
  return api.get(`api/referral/my-stats?memberId=${memberId}`).json();
}

/**
 * Get my referral rewards
 */
export async function getMyReferralRewards(
  memberId: UUID,
  params: { page?: number; size?: number } = {}
): Promise<PaginatedResponse<ReferralReward>> {
  const searchParams = new URLSearchParams();
  searchParams.set("memberId", memberId);
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  return api.get(`api/referral/my-rewards?${searchParams.toString()}`).json();
}

// ============ Public Endpoints ============

/**
 * Track a referral click (public, no auth)
 */
export async function trackReferralClick(code: string): Promise<ReferralTrackResponse> {
  return api.get(`api/public/ref/${code}`).json();
}

/**
 * Validate a referral code (public, no auth)
 */
export async function validateReferralCode(code: string): Promise<ReferralCodeValidation> {
  return api.post(`api/public/ref/${code}/validate`).json();
}

/**
 * Get referral code info (public, no auth)
 */
export async function getReferralCodeInfo(code: string): Promise<ReferralCodeValidation> {
  return api.get(`api/public/ref/${code}/info`).json();
}
