import api from '@/api/client'
import type {
  PageResponse,
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
} from '@/types'

const BASE_URL = 'api/platform/support'

/**
 * Get client overview for support.
 */
export async function getClientOverview(
  organizationId: string,
): Promise<ClientSupportOverview> {
  return api
    .get<ClientSupportOverview>(`${BASE_URL}/clients/${organizationId}/overview`)
    .then((r) => r.data)
}

/**
 * Get client members.
 */
export async function getClientMembers(
  organizationId: string,
  clubId: string,
  queryParams: SupportMemberQueryParams = {},
): Promise<PageResponse<ClientMemberSummary>> {
  const params: Record<string, string | number> = {}
  if (queryParams.page !== undefined) params.page = queryParams.page
  if (queryParams.size !== undefined) params.size = queryParams.size
  if (queryParams.sortBy) params.sortBy = queryParams.sortBy
  if (queryParams.sortDirection) params.sortDirection = queryParams.sortDirection
  if (queryParams.search) params.search = queryParams.search
  if (queryParams.status) params.status = queryParams.status

  return api
    .get<PageResponse<ClientMemberSummary>>(
      `${BASE_URL}/clients/${organizationId}/clubs/${clubId}/members`,
      { params },
    )
    .then((r) => r.data)
}

/**
 * Get member detail.
 */
export async function getMemberDetail(
  organizationId: string,
  clubId: string,
  memberId: string,
): Promise<ClientMemberDetail> {
  return api
    .get<ClientMemberDetail>(
      `${BASE_URL}/clients/${organizationId}/clubs/${clubId}/members/${memberId}`,
    )
    .then((r) => r.data)
}

/**
 * Get client subscriptions (for support view).
 */
export async function getSupportClientSubscriptions(
  organizationId: string,
  clubId: string,
  queryParams: SupportSubscriptionQueryParams = {},
): Promise<PageResponse<ClientMemberSubscription>> {
  const params: Record<string, string | number> = {}
  if (queryParams.page !== undefined) params.page = queryParams.page
  if (queryParams.size !== undefined) params.size = queryParams.size
  if (queryParams.sortBy) params.sortBy = queryParams.sortBy
  if (queryParams.sortDirection) params.sortDirection = queryParams.sortDirection
  if (queryParams.status) params.status = queryParams.status

  return api
    .get<PageResponse<ClientMemberSubscription>>(
      `${BASE_URL}/clients/${organizationId}/clubs/${clubId}/subscriptions`,
      { params },
    )
    .then((r) => r.data)
}

/**
 * Get client invoices (for support view).
 */
export async function getSupportClientInvoices(
  organizationId: string,
  clubId: string,
  queryParams: SupportInvoiceQueryParams = {},
): Promise<PageResponse<ClientMemberInvoice>> {
  const params: Record<string, string | number> = {}
  if (queryParams.page !== undefined) params.page = queryParams.page
  if (queryParams.size !== undefined) params.size = queryParams.size
  if (queryParams.sortBy) params.sortBy = queryParams.sortBy
  if (queryParams.sortDirection) params.sortDirection = queryParams.sortDirection
  if (queryParams.status) params.status = queryParams.status

  return api
    .get<PageResponse<ClientMemberInvoice>>(
      `${BASE_URL}/clients/${organizationId}/clubs/${clubId}/invoices`,
      { params },
    )
    .then((r) => r.data)
}

/**
 * Get client users (staff).
 */
export async function getClientUsers(
  organizationId: string,
  clubId: string,
  queryParams: SupportUserQueryParams = {},
): Promise<PageResponse<ClientUser>> {
  const params: Record<string, string | number> = {}
  if (queryParams.page !== undefined) params.page = queryParams.page
  if (queryParams.size !== undefined) params.size = queryParams.size
  if (queryParams.sortBy) params.sortBy = queryParams.sortBy
  if (queryParams.sortDirection) params.sortDirection = queryParams.sortDirection
  if (queryParams.role) params.role = queryParams.role

  return api
    .get<PageResponse<ClientUser>>(
      `${BASE_URL}/clients/${organizationId}/clubs/${clubId}/users`,
      { params },
    )
    .then((r) => r.data)
}

/**
 * Impersonate a user.
 */
export async function impersonateUser(
  userId: string,
  reason: string,
): Promise<ImpersonationResponse> {
  return api
    .post<ImpersonationResponse>(`${BASE_URL}/impersonate/${userId}`, { reason })
    .then((r) => r.data)
}

/**
 * End impersonation session.
 */
export async function endImpersonation(): Promise<void> {
  await api.post(`${BASE_URL}/end-impersonation`)
}

/**
 * Get active impersonation sessions (PLATFORM_ADMIN only).
 */
export async function getActiveSessions(): Promise<ImpersonationSession[]> {
  return api
    .get<ImpersonationSession[]>(`${BASE_URL}/impersonation/sessions`)
    .then((r) => r.data)
}

/**
 * Force end an impersonation session (PLATFORM_ADMIN only).
 */
export async function forceEndSession(sessionId: string): Promise<void> {
  await api.post(`${BASE_URL}/impersonation/sessions/${sessionId}/end`)
}
