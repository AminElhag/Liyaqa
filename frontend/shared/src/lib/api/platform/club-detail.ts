import { api } from "../client";
import type { PageResponse } from "../../../types/api";
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
  CreateClubUserRequest,
  UpdateClubUserRequest,
  ClubLocation,
  ClubMembershipPlan,
  UpdateClubRequest,
} from "../../../types/platform";

const BASE_URL = "api/platform/clubs";

// ============================================
// Club Detail
// ============================================

/**
 * Get club details with statistics
 */
export async function getClubDetail(clubId: string): Promise<PlatformClubDetail> {
  return api.get(`${BASE_URL}/${clubId}`).json<PlatformClubDetail>();
}

// ============================================
// Club Users
// ============================================

/**
 * Get users for a club with pagination
 */
export async function getClubUsers(
  clubId: string,
  params: ClubDetailQueryParams = {}
): Promise<PageResponse<ClubUser>> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortDirection) searchParams.set("sortDirection", params.sortDirection);

  return api
    .get(`${BASE_URL}/${clubId}/users`, { searchParams })
    .json<PageResponse<ClubUser>>();
}

/**
 * Get user statistics for a club
 */
export async function getClubUserStats(clubId: string): Promise<ClubUserStats> {
  return api.get(`${BASE_URL}/${clubId}/users/stats`).json<ClubUserStats>();
}

/**
 * Reset password for a user in a club (admin action)
 */
export async function resetUserPassword(
  clubId: string,
  userId: string,
  data: ResetPasswordRequest
): Promise<ClubUser> {
  return api
    .post(`${BASE_URL}/${clubId}/users/${userId}/reset-password`, { json: data })
    .json<ClubUser>();
}

/**
 * Create a new user for a club
 */
export async function createClubUser(
  clubId: string,
  data: CreateClubUserRequest
): Promise<ClubUser> {
  return api.post(`${BASE_URL}/${clubId}/users`, { json: data }).json<ClubUser>();
}

/**
 * Update a user in a club (admin action)
 */
export async function updateClubUser(
  clubId: string,
  userId: string,
  data: UpdateClubUserRequest
): Promise<ClubUser> {
  return api
    .put(`${BASE_URL}/${clubId}/users/${userId}`, { json: data })
    .json<ClubUser>();
}

// ============================================
// Club Employees
// ============================================

/**
 * Get employees for a club with pagination
 */
export async function getClubEmployees(
  clubId: string,
  params: ClubDetailQueryParams = {}
): Promise<PageResponse<ClubEmployee>> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortDirection) searchParams.set("sortDirection", params.sortDirection);

  return api
    .get(`${BASE_URL}/${clubId}/employees`, { searchParams })
    .json<PageResponse<ClubEmployee>>();
}

/**
 * Get employee statistics for a club
 */
export async function getClubEmployeeStats(clubId: string): Promise<ClubEmployeeStats> {
  return api.get(`${BASE_URL}/${clubId}/employees/stats`).json<ClubEmployeeStats>();
}

// ============================================
// Club Subscriptions (Member Subscriptions)
// ============================================

/**
 * Get subscriptions for a club with pagination
 */
export async function getClubSubscriptions(
  clubId: string,
  params: ClubDetailQueryParams = {}
): Promise<PageResponse<ClubSubscription>> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortDirection) searchParams.set("sortDirection", params.sortDirection);

  return api
    .get(`${BASE_URL}/${clubId}/subscriptions`, { searchParams })
    .json<PageResponse<ClubSubscription>>();
}

/**
 * Get subscription statistics for a club
 */
export async function getClubSubscriptionStats(clubId: string): Promise<ClubSubscriptionStats> {
  return api.get(`${BASE_URL}/${clubId}/subscriptions/stats`).json<ClubSubscriptionStats>();
}

// ============================================
// Club Audit Logs
// ============================================

/**
 * Get audit logs for a club with pagination and optional action filter
 */
export async function getClubAuditLogs(
  clubId: string,
  params: ClubAuditLogQueryParams = {}
): Promise<PageResponse<ClubAuditLog>> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortDirection) searchParams.set("sortDirection", params.sortDirection);
  if (params.action) searchParams.set("action", params.action);

  return api
    .get(`${BASE_URL}/${clubId}/audit-logs`, { searchParams })
    .json<PageResponse<ClubAuditLog>>();
}

/**
 * Get available audit actions for filter dropdown
 */
export async function getAuditActions(): Promise<string[]> {
  return api.get(`${BASE_URL}/audit-actions`).json<string[]>();
}

// ============================================
// Club Locations
// ============================================

/**
 * Get locations for a club with pagination
 */
export async function getClubLocations(
  clubId: string,
  params: ClubDetailQueryParams = {}
): Promise<PageResponse<ClubLocation>> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortDirection) searchParams.set("sortDirection", params.sortDirection);

  return api
    .get(`${BASE_URL}/${clubId}/locations`, { searchParams })
    .json<PageResponse<ClubLocation>>();
}

// ============================================
// Club Membership Plans
// ============================================

/**
 * Get membership plans for a club with pagination
 */
export async function getClubMembershipPlans(
  clubId: string,
  params: ClubDetailQueryParams = {}
): Promise<PageResponse<ClubMembershipPlan>> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortDirection) searchParams.set("sortDirection", params.sortDirection);

  return api
    .get(`${BASE_URL}/${clubId}/membership-plans`, { searchParams })
    .json<PageResponse<ClubMembershipPlan>>();
}

// ============================================
// Club Update Operations
// ============================================

/**
 * Update club basic info (name, description)
 */
export async function updateClub(
  clubId: string,
  data: UpdateClubRequest
): Promise<PlatformClubDetail> {
  return api
    .put(`${BASE_URL}/${clubId}`, { json: data })
    .json<PlatformClubDetail>();
}

/**
 * Activate a suspended club
 */
export async function activateClub(clubId: string): Promise<PlatformClubDetail> {
  return api
    .post(`${BASE_URL}/${clubId}/activate`)
    .json<PlatformClubDetail>();
}

/**
 * Suspend an active club
 */
export async function suspendClub(clubId: string): Promise<PlatformClubDetail> {
  return api
    .post(`${BASE_URL}/${clubId}/suspend`)
    .json<PlatformClubDetail>();
}
