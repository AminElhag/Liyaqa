import { api } from "./client";
import type { PaginatedResponse, UUID } from "@/types/api";
import type {
  Agreement,
  MemberAgreement,
  MemberAgreementStatus,
  CreateAgreementRequest,
  UpdateAgreementRequest,
  SignAgreementRequest,
  AgreementQueryParams,
} from "@/types/agreement";

const AGREEMENTS_ENDPOINT = "api/agreements";

/**
 * Build query string from params
 */
function buildQueryString(params: AgreementQueryParams): string {
  const searchParams = new URLSearchParams();
  if (params.type) searchParams.set("type", params.type);
  if (params.active !== undefined) searchParams.set("active", String(params.active));
  if (params.mandatory !== undefined) searchParams.set("mandatory", String(params.mandatory));
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortDirection) searchParams.set("sortDirection", params.sortDirection);
  return searchParams.toString();
}

// ==========================================
// AGREEMENT CRUD (Admin)
// ==========================================

/**
 * Get paginated list of agreements
 */
export async function getAgreements(
  params: AgreementQueryParams = {}
): Promise<PaginatedResponse<Agreement>> {
  const query = buildQueryString(params);
  const url = query ? `${AGREEMENTS_ENDPOINT}?${query}` : AGREEMENTS_ENDPOINT;
  return api.get(url).json();
}

/**
 * Get agreement by ID
 */
export async function getAgreement(id: UUID): Promise<Agreement> {
  return api.get(`${AGREEMENTS_ENDPOINT}/${id}`).json();
}

/**
 * Get only active agreements
 */
export async function getActiveAgreements(): Promise<Agreement[]> {
  const response = await api.get<PaginatedResponse<Agreement>>(`${AGREEMENTS_ENDPOINT}?activeOnly=true&size=100`).json();
  return response.content;
}

/**
 * Create a new agreement
 */
export async function createAgreement(data: CreateAgreementRequest): Promise<Agreement> {
  return api.post(AGREEMENTS_ENDPOINT, { json: data }).json();
}

/**
 * Update an existing agreement
 */
export async function updateAgreement(
  id: UUID,
  data: UpdateAgreementRequest
): Promise<Agreement> {
  return api.put(`${AGREEMENTS_ENDPOINT}/${id}`, { json: data }).json();
}

/**
 * Delete an agreement
 */
export async function deleteAgreement(id: UUID): Promise<void> {
  await api.delete(`${AGREEMENTS_ENDPOINT}/${id}`);
}

/**
 * Activate an agreement
 */
export async function activateAgreement(id: UUID): Promise<Agreement> {
  return api.post(`${AGREEMENTS_ENDPOINT}/${id}/activate`).json();
}

/**
 * Deactivate an agreement
 */
export async function deactivateAgreement(id: UUID): Promise<Agreement> {
  return api.post(`${AGREEMENTS_ENDPOINT}/${id}/deactivate`).json();
}

// ==========================================
// MEMBER AGREEMENTS
// ==========================================

/**
 * Get member's signed agreements
 */
export async function getMemberAgreements(memberId: UUID): Promise<MemberAgreement[]> {
  return api.get(`api/members/${memberId}/agreements`).json();
}

/**
 * Get member's agreement status (signed + pending)
 */
export async function getMemberAgreementStatus(memberId: UUID): Promise<MemberAgreementStatus> {
  return api.get(`api/members/${memberId}/agreements/status`).json();
}

/**
 * Sign an agreement for a member
 */
export async function signAgreement(
  memberId: UUID,
  agreementId: UUID,
  data: SignAgreementRequest = {}
): Promise<MemberAgreement> {
  return api.post(`api/members/${memberId}/agreements/${agreementId}/sign`, { json: data }).json();
}

/**
 * Get mandatory agreements (convenience wrapper)
 */
export async function getMandatoryAgreements(): Promise<Agreement[]> {
  const response = await getAgreements({ active: true, mandatory: true, size: 100 });
  return response.content;
}

// ==========================================
// MEMBER SELF-SERVICE (api/me/agreements)
// ==========================================

/**
 * Get my signed agreements (self-service)
 */
export async function getMyAgreements(): Promise<MemberAgreement[]> {
  return api.get("api/me/agreements").json();
}

/**
 * Get my agreement status (self-service)
 */
export async function getMyAgreementStatus(): Promise<MemberAgreementStatus> {
  return api.get("api/me/agreements/status").json();
}

/**
 * Sign an agreement (self-service)
 */
export async function signMyAgreement(
  agreementId: UUID,
  data: SignAgreementRequest = {}
): Promise<MemberAgreement> {
  return api.post(`api/me/agreements/${agreementId}/sign`, { json: data }).json();
}

/**
 * Sign multiple agreements (self-service)
 */
export async function signMyAgreementsBulk(
  agreementIds: UUID[],
  data: SignAgreementRequest = {}
): Promise<MemberAgreement[]> {
  return api.post("api/me/agreements/bulk", { json: { agreementIds, ...data } }).json();
}
