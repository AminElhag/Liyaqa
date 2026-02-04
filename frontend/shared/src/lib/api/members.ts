import { api } from "./client";
import type { PaginatedResponse, UUID } from "../types/api";
import type {
  Member,
  CreateMemberRequest,
  UpdateMemberRequest,
  MemberQueryParams,
} from "../types/member";

const MEMBERS_ENDPOINT = "api/members";

/**
 * Build query string from params
 */
function buildQueryString(params: MemberQueryParams): string {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set("search", params.search);
  if (params.status) searchParams.set("status", params.status);
  if (params.joinedAfter) searchParams.set("joinedAfter", params.joinedAfter);
  if (params.joinedBefore) searchParams.set("joinedBefore", params.joinedBefore);
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  return searchParams.toString();
}

/**
 * Get paginated list of members
 */
export async function getMembers(
  params: MemberQueryParams = {}
): Promise<PaginatedResponse<Member>> {
  const query = buildQueryString(params);
  const url = query ? `${MEMBERS_ENDPOINT}?${query}` : MEMBERS_ENDPOINT;
  return api.get(url).json();
}

/**
 * Get member by ID
 */
export async function getMember(id: UUID): Promise<Member> {
  return api.get(`${MEMBERS_ENDPOINT}/${id}`).json();
}

/**
 * Create a new member
 */
export async function createMember(data: CreateMemberRequest): Promise<Member> {
  return api.post(MEMBERS_ENDPOINT, { json: data }).json();
}

/**
 * Update an existing member
 */
export async function updateMember(
  id: UUID,
  data: UpdateMemberRequest
): Promise<Member> {
  return api.put(`${MEMBERS_ENDPOINT}/${id}`, { json: data }).json();
}

/**
 * Delete a member
 */
export async function deleteMember(id: UUID): Promise<void> {
  await api.delete(`${MEMBERS_ENDPOINT}/${id}`);
}

/**
 * Suspend a member
 */
export async function suspendMember(id: UUID): Promise<Member> {
  return api.post(`${MEMBERS_ENDPOINT}/${id}/suspend`).json();
}

/**
 * Activate a member
 */
export async function activateMember(id: UUID): Promise<Member> {
  return api.post(`${MEMBERS_ENDPOINT}/${id}/activate`).json();
}

/**
 * Bulk delete members
 */
export async function bulkDeleteMembers(ids: UUID[]): Promise<void> {
  await api.post(`${MEMBERS_ENDPOINT}/bulk/delete`, { json: { ids } });
}

/**
 * Bulk suspend members
 */
export async function bulkSuspendMembers(ids: UUID[]): Promise<void> {
  await api.post(`${MEMBERS_ENDPOINT}/bulk/suspend`, { json: { ids } });
}

/**
 * Bulk activate members
 */
export async function bulkActivateMembers(ids: UUID[]): Promise<void> {
  await api.post(`${MEMBERS_ENDPOINT}/bulk/activate`, { json: { ids } });
}

/**
 * Reset member password (admin action)
 */
export async function resetMemberPassword(
  memberId: UUID,
  newPassword: string
): Promise<void> {
  await api.post(`${MEMBERS_ENDPOINT}/${memberId}/reset-password`, {
    json: { newPassword },
  });
}

/**
 * Response type for user account creation
 */
export interface UserAccountResponse {
  userId: UUID;
  email: string;
  role: string;
  status: string;
}

/**
 * Create a user account for a member (admin action)
 */
export async function createUserForMember(
  memberId: UUID,
  password: string
): Promise<UserAccountResponse> {
  return api.post(`${MEMBERS_ENDPOINT}/${memberId}/user`, {
    json: { password },
  }).json();
}
