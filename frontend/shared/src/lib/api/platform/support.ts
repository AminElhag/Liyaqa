import { api } from "../client";
import type { PageResponse } from "../types/api";
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
} from "../types/platform";

const BASE_URL = "api/platform/support";

/**
 * Get client overview for support
 */
export async function getClientOverview(organizationId: string): Promise<ClientSupportOverview> {
  return api.get(`${BASE_URL}/clients/${organizationId}/overview`).json<ClientSupportOverview>();
}

/**
 * Get client members
 */
export async function getClientMembers(
  organizationId: string,
  clubId: string,
  params: SupportMemberQueryParams = {}
): Promise<PageResponse<ClientMemberSummary>> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortDirection) searchParams.set("sortDirection", params.sortDirection);
  if (params.search) searchParams.set("search", params.search);
  if (params.status) searchParams.set("status", params.status);

  return api
    .get(`${BASE_URL}/clients/${organizationId}/clubs/${clubId}/members`, { searchParams })
    .json<PageResponse<ClientMemberSummary>>();
}

/**
 * Get member detail
 */
export async function getMemberDetail(
  organizationId: string,
  clubId: string,
  memberId: string
): Promise<ClientMemberDetail> {
  return api
    .get(`${BASE_URL}/clients/${organizationId}/clubs/${clubId}/members/${memberId}`)
    .json<ClientMemberDetail>();
}

/**
 * Get client subscriptions (for support view)
 */
export async function getSupportClientSubscriptions(
  organizationId: string,
  clubId: string,
  params: SupportSubscriptionQueryParams = {}
): Promise<PageResponse<ClientMemberSubscription>> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortDirection) searchParams.set("sortDirection", params.sortDirection);
  if (params.status) searchParams.set("status", params.status);

  return api
    .get(`${BASE_URL}/clients/${organizationId}/clubs/${clubId}/subscriptions`, { searchParams })
    .json<PageResponse<ClientMemberSubscription>>();
}

/**
 * Get client invoices (for support view)
 */
export async function getSupportClientInvoices(
  organizationId: string,
  clubId: string,
  params: SupportInvoiceQueryParams = {}
): Promise<PageResponse<ClientMemberInvoice>> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortDirection) searchParams.set("sortDirection", params.sortDirection);
  if (params.status) searchParams.set("status", params.status);

  return api
    .get(`${BASE_URL}/clients/${organizationId}/clubs/${clubId}/invoices`, { searchParams })
    .json<PageResponse<ClientMemberInvoice>>();
}

/**
 * Get client users (staff)
 */
export async function getClientUsers(
  organizationId: string,
  clubId: string,
  params: SupportUserQueryParams = {}
): Promise<PageResponse<ClientUser>> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortDirection) searchParams.set("sortDirection", params.sortDirection);
  if (params.role) searchParams.set("role", params.role);

  return api
    .get(`${BASE_URL}/clients/${organizationId}/clubs/${clubId}/users`, { searchParams })
    .json<PageResponse<ClientUser>>();
}

/**
 * Impersonate a user
 */
export async function impersonateUser(
  userId: string,
  reason: string
): Promise<ImpersonationResponse> {
  return api
    .post(`${BASE_URL}/impersonate/${userId}`, { json: { reason } })
    .json<ImpersonationResponse>();
}

/**
 * End impersonation session
 */
export async function endImpersonation(): Promise<void> {
  await api.post(`${BASE_URL}/end-impersonation`);
}

/**
 * Get active impersonation sessions (PLATFORM_ADMIN only)
 */
export async function getActiveSessions(): Promise<ImpersonationSession[]> {
  return api.get(`${BASE_URL}/impersonation/sessions`).json<ImpersonationSession[]>();
}

/**
 * Force end an impersonation session (PLATFORM_ADMIN only)
 */
export async function forceEndSession(sessionId: string): Promise<void> {
  await api.post(`${BASE_URL}/impersonation/sessions/${sessionId}/end`);
}
