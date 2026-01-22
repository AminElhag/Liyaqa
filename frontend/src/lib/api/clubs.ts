import { api } from "./client";
import type { PaginatedResponse, UUID } from "@/types/api";
import type {
  Club,
  ClubQueryParams,
  CreateClubRequest,
  UpdateClubRequest,
} from "@/types/organization";

/**
 * Get paginated clubs
 */
export async function getClubs(
  params: ClubQueryParams = {}
): Promise<PaginatedResponse<Club>> {
  const searchParams = new URLSearchParams();

  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.organizationId)
    searchParams.set("organizationId", params.organizationId);
  if (params.status) searchParams.set("status", params.status);
  if (params.search) searchParams.set("search", params.search);
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.direction) searchParams.set("direction", params.direction);

  const queryString = searchParams.toString();
  const url = queryString ? `api/clubs?${queryString}` : "api/clubs";

  return api.get(url).json();
}

/**
 * Get a single club by ID
 */
export async function getClub(id: UUID): Promise<Club> {
  return api.get(`api/clubs/${id}`).json();
}

/**
 * Get clubs by organization ID
 */
export async function getOrganizationClubs(
  organizationId: UUID,
  params: Omit<ClubQueryParams, "organizationId"> = {}
): Promise<PaginatedResponse<Club>> {
  return getClubs({ ...params, organizationId });
}

/**
 * Create a new club
 */
export async function createClub(data: CreateClubRequest): Promise<Club> {
  return api.post("api/clubs", { json: data }).json();
}

/**
 * Update a club
 */
export async function updateClub(
  id: UUID,
  data: UpdateClubRequest
): Promise<Club> {
  return api.put(`api/clubs/${id}`, { json: data }).json();
}

/**
 * Delete a club (only if CLOSED)
 */
export async function deleteClub(id: UUID): Promise<void> {
  await api.delete(`api/clubs/${id}`);
}

/**
 * Activate a club
 */
export async function activateClub(id: UUID): Promise<Club> {
  return api.post(`api/clubs/${id}/activate`).json();
}

/**
 * Suspend a club
 */
export async function suspendClub(id: UUID): Promise<Club> {
  return api.post(`api/clubs/${id}/suspend`).json();
}

/**
 * Close a club
 */
export async function closeClub(id: UUID): Promise<Club> {
  return api.post(`api/clubs/${id}/close`).json();
}
