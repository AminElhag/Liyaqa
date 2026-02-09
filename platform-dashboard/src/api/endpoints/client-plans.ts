import api from '@/api/client'
import type {
  PageResponse,
  ClientPlan,
  ClientPlanSummary,
  CreateClientPlanRequest,
  UpdateClientPlanRequest,
  ClientPlanQueryParams,
} from '@/types'

const BASE_URL = 'api/platform/plans'

/**
 * Create a new client plan.
 */
export async function createClientPlan(data: CreateClientPlanRequest): Promise<ClientPlan> {
  return api.post<ClientPlan>(BASE_URL, data).then((r) => r.data)
}

/**
 * Get client plan by ID.
 */
export async function getClientPlan(id: string): Promise<ClientPlan> {
  return api.get<ClientPlan>(`${BASE_URL}/${id}`).then((r) => r.data)
}

/**
 * Get all client plans with pagination.
 */
export async function getClientPlans(
  queryParams: ClientPlanQueryParams = {},
): Promise<PageResponse<ClientPlan>> {
  const params: Record<string, string | number | boolean> = {}
  if (queryParams.page !== undefined) params.page = queryParams.page
  if (queryParams.size !== undefined) params.size = queryParams.size
  if (queryParams.sortBy) params.sortBy = queryParams.sortBy
  if (queryParams.sortDirection) params.sortDirection = queryParams.sortDirection
  if (queryParams.isActive !== undefined) params.isActive = queryParams.isActive

  return api.get<PageResponse<ClientPlan>>(BASE_URL, { params }).then((r) => r.data)
}

/**
 * Get active client plans (for dropdowns).
 */
export async function getActiveClientPlans(): Promise<ClientPlanSummary[]> {
  return api.get<ClientPlanSummary[]>(`${BASE_URL}/active/list`).then((r) => r.data)
}

/**
 * Update a client plan.
 */
export async function updateClientPlan(
  id: string,
  data: UpdateClientPlanRequest,
): Promise<ClientPlan> {
  return api.put<ClientPlan>(`${BASE_URL}/${id}`, data).then((r) => r.data)
}

/**
 * Activate a client plan.
 */
export async function activateClientPlan(id: string): Promise<ClientPlan> {
  return api.post<ClientPlan>(`${BASE_URL}/${id}/activate`).then((r) => r.data)
}

/**
 * Deactivate a client plan.
 */
export async function deactivateClientPlan(id: string): Promise<ClientPlan> {
  return api.post<ClientPlan>(`${BASE_URL}/${id}/deactivate`).then((r) => r.data)
}

/**
 * Delete a client plan.
 */
export async function deleteClientPlan(id: string): Promise<void> {
  await api.delete(`${BASE_URL}/${id}`)
}
