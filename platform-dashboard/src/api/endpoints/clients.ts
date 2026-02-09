import api from '@/api/client'
import type {
  PageResponse,
  Client,
  ClientClub,
  OnboardingResult,
  AdminUser,
  ClientStats,
  OnboardClientRequest,
  SetupAdminRequest,
  CreateClientClubRequest,
  ClientQueryParams,
  ClientHealth,
} from '@/types'

const BASE_URL = 'api/platform/clients'

/**
 * Onboard a new client (creates organization, club, admin user, and optionally subscription).
 */
export async function onboardClient(data: OnboardClientRequest): Promise<OnboardingResult> {
  return api.post<OnboardingResult>(BASE_URL, data).then((r) => r.data)
}

/**
 * Get client by ID.
 */
export async function getClient(id: string): Promise<Client> {
  return api.get<Client>(`${BASE_URL}/${id}`).then((r) => r.data)
}

/**
 * Get all clients with pagination and filters.
 */
export async function getClients(
  queryParams: ClientQueryParams = {},
): Promise<PageResponse<Client>> {
  const params: Record<string, string | number> = {}
  if (queryParams.page !== undefined) params.page = queryParams.page
  if (queryParams.size !== undefined) params.size = queryParams.size
  if (queryParams.sortBy) params.sortBy = queryParams.sortBy
  if (queryParams.sortDirection) params.sortDirection = queryParams.sortDirection
  if (queryParams.status) params.status = queryParams.status
  if (queryParams.search) params.search = queryParams.search

  return api.get<PageResponse<Client>>(BASE_URL, { params }).then((r) => r.data)
}

/**
 * Get client statistics.
 */
export async function getClientStats(): Promise<ClientStats> {
  return api.get<ClientStats>(`${BASE_URL}/stats`).then((r) => r.data)
}

/**
 * Activate a client.
 */
export async function activateClient(id: string): Promise<Client> {
  return api.post<Client>(`${BASE_URL}/${id}/activate`).then((r) => r.data)
}

/**
 * Suspend a client.
 */
export async function suspendClient(id: string): Promise<Client> {
  return api.post<Client>(`${BASE_URL}/${id}/suspend`).then((r) => r.data)
}

/**
 * Setup admin user for an organization.
 */
export async function setupAdmin(
  organizationId: string,
  data: SetupAdminRequest,
): Promise<AdminUser> {
  return api
    .post<AdminUser>(`${BASE_URL}/${organizationId}/setup-admin`, data)
    .then((r) => r.data)
}

/**
 * Get clubs for a client.
 */
export async function getClientClubs(
  organizationId: string,
  queryParams: { page?: number; size?: number } = {},
): Promise<PageResponse<ClientClub>> {
  const params: Record<string, number> = {}
  if (queryParams.page !== undefined) params.page = queryParams.page
  if (queryParams.size !== undefined) params.size = queryParams.size

  return api
    .get<PageResponse<ClientClub>>(`${BASE_URL}/${organizationId}/clubs`, { params })
    .then((r) => r.data)
}

/**
 * Create a club for a client.
 */
export async function createClientClub(
  organizationId: string,
  data: CreateClientClubRequest,
): Promise<ClientClub> {
  return api
    .post<ClientClub>(`${BASE_URL}/${organizationId}/clubs`, data)
    .then((r) => r.data)
}

/**
 * Get client health indicators.
 */
export async function getClientHealth(id: string): Promise<ClientHealth> {
  return api.get<ClientHealth>(`${BASE_URL}/${id}/health`).then((r) => r.data)
}
