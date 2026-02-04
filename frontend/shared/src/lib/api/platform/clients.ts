import { api } from "../client";
import type { PageResponse } from "../types/api";
import type {
  Client,
  ClientClub,
  OnboardingResult,
  AdminUser,
  ClientStats,
  OnboardClientRequest,
  SetupAdminRequest,
  CreateClientClubRequest,
  ClientQueryParams,
} from "../types/platform";
import type { ClientHealth } from "../types/platform/client-health";

const BASE_URL = "api/platform/clients";

/**
 * Onboard a new client (creates organization, club, admin user, and optionally subscription)
 */
export async function onboardClient(data: OnboardClientRequest): Promise<OnboardingResult> {
  return api.post(BASE_URL, { json: data }).json<OnboardingResult>();
}

/**
 * Get client by ID
 */
export async function getClient(id: string): Promise<Client> {
  return api.get(`${BASE_URL}/${id}`).json<Client>();
}

/**
 * Get all clients with pagination and filters
 */
export async function getClients(
  params: ClientQueryParams = {}
): Promise<PageResponse<Client>> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortDirection) searchParams.set("sortDirection", params.sortDirection);
  if (params.status) searchParams.set("status", params.status);
  if (params.search) searchParams.set("search", params.search);

  return api.get(BASE_URL, { searchParams }).json<PageResponse<Client>>();
}

/**
 * Get client statistics
 */
export async function getClientStats(): Promise<ClientStats> {
  return api.get(`${BASE_URL}/stats`).json<ClientStats>();
}

/**
 * Activate a client
 */
export async function activateClient(id: string): Promise<Client> {
  return api.post(`${BASE_URL}/${id}/activate`).json<Client>();
}

/**
 * Suspend a client
 */
export async function suspendClient(id: string): Promise<Client> {
  return api.post(`${BASE_URL}/${id}/suspend`).json<Client>();
}

/**
 * Setup admin user for an organization
 */
export async function setupAdmin(
  organizationId: string,
  data: SetupAdminRequest
): Promise<AdminUser> {
  return api
    .post(`${BASE_URL}/${organizationId}/setup-admin`, { json: data })
    .json<AdminUser>();
}

/**
 * Get clubs for a client
 */
export async function getClientClubs(
  organizationId: string,
  params: { page?: number; size?: number } = {}
): Promise<PageResponse<ClientClub>> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  return api
    .get(`${BASE_URL}/${organizationId}/clubs`, { searchParams })
    .json<PageResponse<ClientClub>>();
}

/**
 * Create a club for a client
 */
export async function createClientClub(
  organizationId: string,
  data: CreateClientClubRequest
): Promise<ClientClub> {
  return api
    .post(`${BASE_URL}/${organizationId}/clubs`, { json: data })
    .json<ClientClub>();
}

/**
 * Get client health indicators
 */
export async function getClientHealth(id: string): Promise<ClientHealth> {
  return api.get(`${BASE_URL}/${id}/health`).json<ClientHealth>();
}
