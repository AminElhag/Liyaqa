import api from '@/api/client'
import type {
  PlatformUser,
  PlatformUserStats,
  PlatformUserPage,
  PlatformUserActivityPage,
  CreatePlatformUserRequest,
  UpdatePlatformUserRequest,
  ChangeUserStatusRequest,
  ResetUserPasswordRequest,
  PlatformUserQueryParams,
} from '@/types'

const BASE_URL = 'api/platform/users'

/**
 * Create a new platform user.
 */
export async function createPlatformUser(
  data: CreatePlatformUserRequest,
): Promise<PlatformUser> {
  return api.post<PlatformUser>(BASE_URL, data).then((r) => r.data)
}

/**
 * Get a platform user by ID.
 */
export async function getPlatformUser(id: string): Promise<PlatformUser> {
  return api.get<PlatformUser>(`${BASE_URL}/${id}`).then((r) => r.data)
}

/**
 * Get paginated list of platform users.
 */
export async function getPlatformUsers(
  queryParams: PlatformUserQueryParams = {},
): Promise<PlatformUserPage> {
  const params: Record<string, string | number> = {}
  if (queryParams.page !== undefined) params.page = queryParams.page
  if (queryParams.size !== undefined) params.size = queryParams.size
  if (queryParams.sortBy) params.sortBy = queryParams.sortBy
  if (queryParams.sortDirection) params.sortDirection = queryParams.sortDirection
  if (queryParams.status) params.status = queryParams.status
  if (queryParams.role) params.role = queryParams.role
  if (queryParams.search) params.search = queryParams.search

  return api.get<PlatformUserPage>(BASE_URL, { params }).then((r) => r.data)
}

/**
 * Get platform user statistics.
 */
export async function getPlatformUserStats(): Promise<PlatformUserStats> {
  return api.get<PlatformUserStats>(`${BASE_URL}/stats`).then((r) => r.data)
}

/**
 * Update a platform user.
 */
export async function updatePlatformUser(
  id: string,
  data: UpdatePlatformUserRequest,
): Promise<PlatformUser> {
  return api.patch<PlatformUser>(`${BASE_URL}/${id}`, data).then((r) => r.data)
}

/**
 * Change platform user status (activate/suspend/deactivate).
 */
export async function changePlatformUserStatus(
  id: string,
  data: ChangeUserStatusRequest,
): Promise<PlatformUser> {
  return api
    .post<PlatformUser>(`${BASE_URL}/${id}/status`, data)
    .then((r) => r.data)
}

/**
 * Reset platform user password (admin-initiated).
 */
export async function resetPlatformUserPassword(
  id: string,
  data: ResetUserPasswordRequest,
): Promise<void> {
  await api.post(`${BASE_URL}/${id}/reset-password`, data)
}

/**
 * Get activity log for a platform user.
 */
export async function getPlatformUserActivities(
  id: string,
  queryParams: { page?: number; size?: number } = {},
): Promise<PlatformUserActivityPage> {
  const params: Record<string, number> = {}
  if (queryParams.page !== undefined) params.page = queryParams.page
  if (queryParams.size !== undefined) params.size = queryParams.size

  return api
    .get<PlatformUserActivityPage>(`${BASE_URL}/${id}/activities`, { params })
    .then((r) => r.data)
}

/**
 * Delete a platform user.
 */
export async function deletePlatformUser(id: string): Promise<void> {
  await api.delete(`${BASE_URL}/${id}`)
}
