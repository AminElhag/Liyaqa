import api from '@/api/client'
import type {
  PageResponse,
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
  ClubLocation,
  ClubMembershipPlan,
  UpdateClubRequest,
} from '@/types'

const BASE_URL = 'api/platform/clubs'

// ============================================
// Club Detail
// ============================================

/**
 * Get club details with statistics.
 */
export async function getClubDetail(clubId: string): Promise<PlatformClubDetail> {
  return api.get<PlatformClubDetail>(`${BASE_URL}/${clubId}`).then((r) => r.data)
}

// ============================================
// Club Users
// ============================================

/**
 * Get users for a club with pagination.
 */
export async function getClubUsers(
  clubId: string,
  queryParams: ClubDetailQueryParams = {},
): Promise<PageResponse<ClubUser>> {
  const params: Record<string, string | number> = {}
  if (queryParams.page !== undefined) params.page = queryParams.page
  if (queryParams.size !== undefined) params.size = queryParams.size
  if (queryParams.sortBy) params.sortBy = queryParams.sortBy
  if (queryParams.sortDirection) params.sortDirection = queryParams.sortDirection

  return api
    .get<PageResponse<ClubUser>>(`${BASE_URL}/${clubId}/users`, { params })
    .then((r) => r.data)
}

/**
 * Get user statistics for a club.
 */
export async function getClubUserStats(clubId: string): Promise<ClubUserStats> {
  return api
    .get<ClubUserStats>(`${BASE_URL}/${clubId}/users/stats`)
    .then((r) => r.data)
}

/**
 * Reset password for a user in a club (admin action).
 */
export async function resetUserPassword(
  clubId: string,
  userId: string,
  data: ResetPasswordRequest,
): Promise<ClubUser> {
  return api
    .post<ClubUser>(`${BASE_URL}/${clubId}/users/${userId}/reset-password`, data)
    .then((r) => r.data)
}

// ============================================
// Club Employees
// ============================================

/**
 * Get employees for a club with pagination.
 */
export async function getClubEmployees(
  clubId: string,
  queryParams: ClubDetailQueryParams = {},
): Promise<PageResponse<ClubEmployee>> {
  const params: Record<string, string | number> = {}
  if (queryParams.page !== undefined) params.page = queryParams.page
  if (queryParams.size !== undefined) params.size = queryParams.size
  if (queryParams.sortBy) params.sortBy = queryParams.sortBy
  if (queryParams.sortDirection) params.sortDirection = queryParams.sortDirection

  return api
    .get<PageResponse<ClubEmployee>>(`${BASE_URL}/${clubId}/employees`, { params })
    .then((r) => r.data)
}

/**
 * Get employee statistics for a club.
 */
export async function getClubEmployeeStats(clubId: string): Promise<ClubEmployeeStats> {
  return api
    .get<ClubEmployeeStats>(`${BASE_URL}/${clubId}/employees/stats`)
    .then((r) => r.data)
}

// ============================================
// Club Subscriptions (Member Subscriptions)
// ============================================

/**
 * Get subscriptions for a club with pagination.
 */
export async function getClubSubscriptions(
  clubId: string,
  queryParams: ClubDetailQueryParams = {},
): Promise<PageResponse<ClubSubscription>> {
  const params: Record<string, string | number> = {}
  if (queryParams.page !== undefined) params.page = queryParams.page
  if (queryParams.size !== undefined) params.size = queryParams.size
  if (queryParams.sortBy) params.sortBy = queryParams.sortBy
  if (queryParams.sortDirection) params.sortDirection = queryParams.sortDirection

  return api
    .get<PageResponse<ClubSubscription>>(`${BASE_URL}/${clubId}/subscriptions`, {
      params,
    })
    .then((r) => r.data)
}

/**
 * Get subscription statistics for a club.
 */
export async function getClubSubscriptionStats(
  clubId: string,
): Promise<ClubSubscriptionStats> {
  return api
    .get<ClubSubscriptionStats>(`${BASE_URL}/${clubId}/subscriptions/stats`)
    .then((r) => r.data)
}

// ============================================
// Club Audit Logs
// ============================================

/**
 * Get audit logs for a club with pagination and optional action filter.
 */
export async function getClubAuditLogs(
  clubId: string,
  queryParams: ClubAuditLogQueryParams = {},
): Promise<PageResponse<ClubAuditLog>> {
  const params: Record<string, string | number> = {}
  if (queryParams.page !== undefined) params.page = queryParams.page
  if (queryParams.size !== undefined) params.size = queryParams.size
  if (queryParams.sortBy) params.sortBy = queryParams.sortBy
  if (queryParams.sortDirection) params.sortDirection = queryParams.sortDirection
  if (queryParams.action) params.action = queryParams.action

  return api
    .get<PageResponse<ClubAuditLog>>(`${BASE_URL}/${clubId}/audit-logs`, { params })
    .then((r) => r.data)
}

/**
 * Get available audit actions for filter dropdown.
 */
export async function getAuditActions(): Promise<string[]> {
  return api.get<string[]>(`${BASE_URL}/audit-actions`).then((r) => r.data)
}

// ============================================
// Club Locations
// ============================================

/**
 * Get locations for a club with pagination.
 */
export async function getClubLocations(
  clubId: string,
  queryParams: ClubDetailQueryParams = {},
): Promise<PageResponse<ClubLocation>> {
  const params: Record<string, string | number> = {}
  if (queryParams.page !== undefined) params.page = queryParams.page
  if (queryParams.size !== undefined) params.size = queryParams.size
  if (queryParams.sortBy) params.sortBy = queryParams.sortBy
  if (queryParams.sortDirection) params.sortDirection = queryParams.sortDirection

  return api
    .get<PageResponse<ClubLocation>>(`${BASE_URL}/${clubId}/locations`, { params })
    .then((r) => r.data)
}

// ============================================
// Club Membership Plans
// ============================================

/**
 * Get membership plans for a club with pagination.
 */
export async function getClubMembershipPlans(
  clubId: string,
  queryParams: ClubDetailQueryParams = {},
): Promise<PageResponse<ClubMembershipPlan>> {
  const params: Record<string, string | number> = {}
  if (queryParams.page !== undefined) params.page = queryParams.page
  if (queryParams.size !== undefined) params.size = queryParams.size
  if (queryParams.sortBy) params.sortBy = queryParams.sortBy
  if (queryParams.sortDirection) params.sortDirection = queryParams.sortDirection

  return api
    .get<PageResponse<ClubMembershipPlan>>(`${BASE_URL}/${clubId}/membership-plans`, {
      params,
    })
    .then((r) => r.data)
}

// ============================================
// Club Update Operations
// ============================================

/**
 * Update club basic info (name, description).
 */
export async function updateClub(
  clubId: string,
  data: UpdateClubRequest,
): Promise<PlatformClubDetail> {
  return api
    .put<PlatformClubDetail>(`${BASE_URL}/${clubId}`, data)
    .then((r) => r.data)
}

/**
 * Activate a suspended club.
 */
export async function activateClub(clubId: string): Promise<PlatformClubDetail> {
  return api
    .post<PlatformClubDetail>(`${BASE_URL}/${clubId}/activate`)
    .then((r) => r.data)
}

/**
 * Suspend an active club.
 */
export async function suspendClub(clubId: string): Promise<PlatformClubDetail> {
  return api
    .post<PlatformClubDetail>(`${BASE_URL}/${clubId}/suspend`)
    .then((r) => r.data)
}
