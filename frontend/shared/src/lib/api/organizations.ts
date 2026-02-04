import { api } from "./client";
import type { PaginatedResponse, UUID } from "../../types/api";
import type {
  Organization,
  OrganizationQueryParams,
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
} from "../../types/organization";

/**
 * Get paginated organizations
 */
export async function getOrganizations(
  params: OrganizationQueryParams = {}
): Promise<PaginatedResponse<Organization>> {
  const searchParams = new URLSearchParams();

  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.status) searchParams.set("status", params.status);
  if (params.search) searchParams.set("search", params.search);
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.direction) searchParams.set("direction", params.direction);

  const queryString = searchParams.toString();
  const url = queryString
    ? `api/organizations?${queryString}`
    : "api/organizations";

  return api.get(url).json();
}

/**
 * Get a single organization by ID
 */
export async function getOrganization(id: UUID): Promise<Organization> {
  return api.get(`api/organizations/${id}`).json();
}

/**
 * Create a new organization
 */
export async function createOrganization(
  data: CreateOrganizationRequest
): Promise<Organization> {
  return api.post("api/organizations", { json: data }).json();
}

/**
 * Update an organization
 */
export async function updateOrganization(
  id: UUID,
  data: UpdateOrganizationRequest
): Promise<Organization> {
  return api.put(`api/organizations/${id}`, { json: data }).json();
}

/**
 * Delete an organization (only if CLOSED)
 */
export async function deleteOrganization(id: UUID): Promise<void> {
  await api.delete(`api/organizations/${id}`);
}

/**
 * Activate an organization
 */
export async function activateOrganization(id: UUID): Promise<Organization> {
  return api.post(`api/organizations/${id}/activate`).json();
}

/**
 * Suspend an organization
 */
export async function suspendOrganization(id: UUID): Promise<Organization> {
  return api.post(`api/organizations/${id}/suspend`).json();
}

/**
 * Close an organization
 */
export async function closeOrganization(id: UUID): Promise<Organization> {
  return api.post(`api/organizations/${id}/close`).json();
}
