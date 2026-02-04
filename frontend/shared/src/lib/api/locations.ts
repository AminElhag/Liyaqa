import { api } from "./client";
import type { PaginatedResponse, UUID } from "../../types/api";
import type {
  Location,
  LocationQueryParams,
  CreateLocationRequest,
  UpdateLocationRequest,
} from "../../types/organization";

/**
 * Get paginated locations
 */
export async function getLocations(
  params: LocationQueryParams = {}
): Promise<PaginatedResponse<Location>> {
  const searchParams = new URLSearchParams();

  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.clubId) searchParams.set("clubId", params.clubId);
  if (params.isActive !== undefined)
    searchParams.set("isActive", String(params.isActive));
  if (params.search) searchParams.set("search", params.search);
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.direction) searchParams.set("direction", params.direction);

  const queryString = searchParams.toString();
  const url = queryString ? `api/locations?${queryString}` : "api/locations";

  return api.get(url).json();
}

/**
 * Get a single location by ID
 */
export async function getLocation(id: UUID): Promise<Location> {
  return api.get(`api/locations/${id}`).json();
}

/**
 * Get locations by club ID
 */
export async function getClubLocations(
  clubId: UUID,
  params: Omit<LocationQueryParams, "clubId"> = {}
): Promise<PaginatedResponse<Location>> {
  return getLocations({ ...params, clubId });
}

/**
 * Create a new location
 */
export async function createLocation(
  data: CreateLocationRequest
): Promise<Location> {
  return api.post("api/locations", { json: data }).json();
}

/**
 * Update a location
 */
export async function updateLocation(
  id: UUID,
  data: UpdateLocationRequest
): Promise<Location> {
  return api.put(`api/locations/${id}`, { json: data }).json();
}

/**
 * Delete a location
 */
export async function deleteLocation(id: UUID): Promise<void> {
  await api.delete(`api/locations/${id}`);
}

/**
 * Reopen a temporarily closed location
 */
export async function reopenLocation(id: UUID): Promise<Location> {
  return api.post(`api/locations/${id}/reopen`).json();
}

/**
 * Temporarily close a location
 */
export async function temporarilyCloseLocation(id: UUID): Promise<Location> {
  return api.post(`api/locations/${id}/temporarily-close`).json();
}

// Aliases for backward compatibility
export const activateLocation = reopenLocation;
export const deactivateLocation = temporarilyCloseLocation;
