import { api } from "./client";
import type { PaginatedResponse, UUID } from "../../types/api";
import type {
  ClassPack,
  MemberClassPackBalance,
  CreateClassPackRequest,
  UpdateClassPackRequest,
  ClassPackStatus,
  ServiceType,
} from "../../types/scheduling";

/**
 * Get paginated class packs
 */
export async function getClassPacks(params: {
  page?: number;
  size?: number;
  status?: ClassPackStatus;
  serviceType?: ServiceType;
  sortBy?: string;
  sortDirection?: "ASC" | "DESC";
} = {}): Promise<PaginatedResponse<ClassPack>> {
  const searchParams = new URLSearchParams();

  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.status) searchParams.set("status", params.status);
  if (params.serviceType) searchParams.set("serviceType", params.serviceType);
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortDirection) searchParams.set("sortDirection", params.sortDirection);

  const queryString = searchParams.toString();
  const url = queryString ? `api/class-packs?${queryString}` : "api/class-packs";

  return api.get(url).json();
}

/**
 * Get active class packs (for purchase page)
 */
export async function getActiveClassPacks(): Promise<ClassPack[]> {
  return api.get("api/class-packs/active").json();
}

/**
 * Get a single class pack by ID
 */
export async function getClassPack(id: UUID): Promise<ClassPack> {
  return api.get(`api/class-packs/${id}`).json();
}

/**
 * Create a new class pack
 */
export async function createClassPack(data: CreateClassPackRequest): Promise<ClassPack> {
  return api.post("api/class-packs", { json: data }).json();
}

/**
 * Update a class pack
 */
export async function updateClassPack(
  id: UUID,
  data: UpdateClassPackRequest
): Promise<ClassPack> {
  return api.put(`api/class-packs/${id}`, { json: data }).json();
}

/**
 * Activate a class pack
 */
export async function activateClassPack(id: UUID): Promise<ClassPack> {
  return api.post(`api/class-packs/${id}/activate`).json();
}

/**
 * Deactivate a class pack
 */
export async function deactivateClassPack(id: UUID): Promise<ClassPack> {
  return api.post(`api/class-packs/${id}/deactivate`).json();
}

/**
 * Delete a class pack
 */
export async function deleteClassPack(id: UUID): Promise<void> {
  await api.delete(`api/class-packs/${id}`);
}

// ==================== MEMBER BALANCES ====================

/**
 * Get member class pack balances
 */
export async function getMemberBalances(
  memberId: UUID,
  params: { page?: number; size?: number } = {}
): Promise<PaginatedResponse<MemberClassPackBalance>> {
  const searchParams = new URLSearchParams();

  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  const queryString = searchParams.toString();
  const url = queryString
    ? `api/class-packs/members/${memberId}/balances?${queryString}`
    : `api/class-packs/members/${memberId}/balances`;

  return api.get(url).json();
}

/**
 * Get active member class pack balances
 */
export async function getActiveMemberBalances(
  memberId: UUID
): Promise<MemberClassPackBalance[]> {
  return api.get(`api/class-packs/members/${memberId}/balances/active`).json();
}

/**
 * Grant a class pack to a member (complimentary)
 */
export async function grantPackToMember(
  memberId: UUID,
  classPackId: UUID
): Promise<MemberClassPackBalance> {
  return api
    .post(`api/class-packs/members/${memberId}/grant`, {
      json: { classPackId },
    })
    .json();
}

/**
 * Cancel a member's class pack balance
 */
export async function cancelBalance(balanceId: UUID): Promise<MemberClassPackBalance> {
  return api.post(`api/class-packs/balances/${balanceId}/cancel`).json();
}
