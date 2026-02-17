import { api } from "./client";
import type { PaginatedResponse, UUID } from "../../types/api";
import type {
  Location,
  LocationQueryParams,
  CreateLocationRequest,
  UpdateLocationRequest,
} from "../../types/organization";

/**
 * Backend response shape (differs from frontend Location type)
 */
interface BackendLocationResponse {
  id: UUID;
  clubId: UUID;
  organizationId?: UUID;
  name: { en: string; ar?: string | null };
  address?: {
    street?: { en?: string; ar?: string } | null;
    building?: { en?: string; ar?: string } | null;
    city?: { en?: string; ar?: string } | null;
    district?: { en?: string; ar?: string } | null;
    postalCode?: string | null;
    countryCode?: string | null;
    formatted?: string;
  } | null;
  phone?: string | null;
  email?: string | null;
  status: "ACTIVE" | "TEMPORARILY_CLOSED" | "PERMANENTLY_CLOSED";
  createdAt: string;
  updatedAt: string;
}

/**
 * Transform backend response to frontend Location type
 */
function toLocation(raw: BackendLocationResponse): Location {
  const addressEn =
    raw.address?.formatted ||
    raw.address?.street?.en ||
    "";
  const addressAr =
    raw.address?.street?.ar ||
    addressEn;

  return {
    id: raw.id,
    clubId: raw.clubId,
    name: { en: raw.name.en, ar: raw.name.ar || undefined },
    address: addressEn ? { en: addressEn, ar: addressAr } : undefined,
    phone: raw.phone || undefined,
    email: raw.email || undefined,
    isActive: raw.status === "ACTIVE",
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

/**
 * Transform frontend create request to backend flat DTO
 */
function toBackendCreate(data: CreateLocationRequest): Record<string, unknown> {
  return {
    clubId: data.clubId,
    nameEn: data.name.en,
    nameAr: data.name.ar || undefined,
    streetEn: data.address?.en || undefined,
    streetAr: data.address?.ar || undefined,
    phone: data.phone,
    email: data.email,
  };
}

/**
 * Transform frontend update request to backend flat DTO
 */
function toBackendUpdate(data: UpdateLocationRequest): Record<string, unknown> {
  return {
    nameEn: data.name?.en,
    nameAr: data.name?.ar || undefined,
    streetEn: data.address?.en || undefined,
    streetAr: data.address?.ar || undefined,
    phone: data.phone,
    email: data.email,
  };
}

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

  const raw: PaginatedResponse<BackendLocationResponse> = await api
    .get(url)
    .json();
  return {
    ...raw,
    content: raw.content.map(toLocation),
  };
}

/**
 * Get a single location by ID
 */
export async function getLocation(id: UUID): Promise<Location> {
  const raw: BackendLocationResponse = await api
    .get(`api/locations/${id}`)
    .json();
  return toLocation(raw);
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
  const raw: BackendLocationResponse = await api
    .post("api/locations", { json: toBackendCreate(data) })
    .json();
  return toLocation(raw);
}

/**
 * Update a location
 */
export async function updateLocation(
  id: UUID,
  data: UpdateLocationRequest
): Promise<Location> {
  const raw: BackendLocationResponse = await api
    .put(`api/locations/${id}`, { json: toBackendUpdate(data) })
    .json();
  return toLocation(raw);
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
  const raw: BackendLocationResponse = await api
    .post(`api/locations/${id}/reopen`)
    .json();
  return toLocation(raw);
}

/**
 * Temporarily close a location
 */
export async function temporarilyCloseLocation(id: UUID): Promise<Location> {
  const raw: BackendLocationResponse = await api
    .post(`api/locations/${id}/temporarily-close`)
    .json();
  return toLocation(raw);
}

// Aliases for backward compatibility
export const activateLocation = reopenLocation;
export const deactivateLocation = temporarilyCloseLocation;
