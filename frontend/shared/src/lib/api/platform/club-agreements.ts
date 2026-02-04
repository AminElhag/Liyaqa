import { api } from "../client";
import type { PaginatedResponse, UUID } from "../types/api";
import type {
  Agreement,
  CreateAgreementRequest,
  UpdateAgreementRequest,
} from "../types/agreement";

/**
 * Build query string from params
 */
function buildQueryString(params: {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}): string {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortDirection) searchParams.set("sortDirection", params.sortDirection);
  return searchParams.toString();
}

// ==========================================
// PLATFORM CLUB AGREEMENT CRUD
// ==========================================

/**
 * Get paginated list of agreements for a club
 */
export async function getClubAgreements(
  clubId: UUID,
  params: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDirection?: "asc" | "desc";
  } = {}
): Promise<PaginatedResponse<Agreement>> {
  const query = buildQueryString(params);
  const url = query
    ? `api/platform/clubs/${clubId}/agreements?${query}`
    : `api/platform/clubs/${clubId}/agreements`;
  return api.get(url).json();
}

/**
 * Get a specific agreement for a club
 */
export async function getClubAgreement(
  clubId: UUID,
  agreementId: UUID
): Promise<Agreement> {
  return api.get(`api/platform/clubs/${clubId}/agreements/${agreementId}`).json();
}

/**
 * Create a new agreement for a club
 */
export async function createClubAgreement(
  clubId: UUID,
  data: CreateAgreementRequest
): Promise<Agreement> {
  return api
    .post(`api/platform/clubs/${clubId}/agreements`, { json: data })
    .json();
}

/**
 * Update an existing agreement for a club
 */
export async function updateClubAgreement(
  clubId: UUID,
  agreementId: UUID,
  data: UpdateAgreementRequest
): Promise<Agreement> {
  return api
    .put(`api/platform/clubs/${clubId}/agreements/${agreementId}`, { json: data })
    .json();
}

/**
 * Activate an agreement for a club
 */
export async function activateClubAgreement(
  clubId: UUID,
  agreementId: UUID
): Promise<Agreement> {
  return api
    .post(`api/platform/clubs/${clubId}/agreements/${agreementId}/activate`)
    .json();
}

/**
 * Deactivate an agreement for a club
 */
export async function deactivateClubAgreement(
  clubId: UUID,
  agreementId: UUID
): Promise<Agreement> {
  return api
    .post(`api/platform/clubs/${clubId}/agreements/${agreementId}/deactivate`)
    .json();
}

/**
 * Delete (deactivate) an agreement for a club
 */
export async function deleteClubAgreement(
  clubId: UUID,
  agreementId: UUID
): Promise<void> {
  await api.delete(`api/platform/clubs/${clubId}/agreements/${agreementId}`);
}
