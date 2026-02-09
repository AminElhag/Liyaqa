import api from '@/api/client'
import type {
  PageResponse,
  ClientSubscription,
  ClientSubscriptionSummary,
  SubscriptionStats,
  CreateClientSubscriptionRequest,
  UpdateClientSubscriptionRequest,
  ChangeSubscriptionPlanRequest,
  RenewSubscriptionRequest,
  ClientSubscriptionQueryParams,
} from '@/types'

const BASE_URL = 'api/platform/subscriptions'

/**
 * Create a new client subscription.
 */
export async function createClientSubscription(
  data: CreateClientSubscriptionRequest,
): Promise<ClientSubscription> {
  return api.post<ClientSubscription>(BASE_URL, data).then((r) => r.data)
}

/**
 * Get client subscription by ID.
 */
export async function getClientSubscription(id: string): Promise<ClientSubscription> {
  return api.get<ClientSubscription>(`${BASE_URL}/${id}`).then((r) => r.data)
}

/**
 * Get all client subscriptions with pagination.
 */
export async function getClientSubscriptions(
  queryParams: ClientSubscriptionQueryParams = {},
): Promise<PageResponse<ClientSubscriptionSummary>> {
  const params: Record<string, string | number> = {}
  if (queryParams.page !== undefined) params.page = queryParams.page
  if (queryParams.size !== undefined) params.size = queryParams.size
  if (queryParams.sortBy) params.sortBy = queryParams.sortBy
  if (queryParams.sortDirection) params.sortDirection = queryParams.sortDirection
  if (queryParams.status) params.status = queryParams.status
  if (queryParams.organizationId) params.organizationId = queryParams.organizationId

  return api
    .get<PageResponse<ClientSubscriptionSummary>>(BASE_URL, { params })
    .then((r) => r.data)
}

/**
 * Get subscriptions by organization.
 */
export async function getSubscriptionsByOrganization(
  organizationId: string,
  queryParams: ClientSubscriptionQueryParams = {},
): Promise<PageResponse<ClientSubscriptionSummary>> {
  const params: Record<string, string | number> = {}
  if (queryParams.page !== undefined) params.page = queryParams.page
  if (queryParams.size !== undefined) params.size = queryParams.size

  return api
    .get<PageResponse<ClientSubscriptionSummary>>(
      `${BASE_URL}/organization/${organizationId}`,
      { params },
    )
    .then((r) => r.data)
}

/**
 * Update a client subscription.
 */
export async function updateClientSubscription(
  id: string,
  data: UpdateClientSubscriptionRequest,
): Promise<ClientSubscription> {
  return api.put<ClientSubscription>(`${BASE_URL}/${id}`, data).then((r) => r.data)
}

/**
 * Activate a client subscription.
 */
export async function activateClientSubscription(id: string): Promise<ClientSubscription> {
  return api.post<ClientSubscription>(`${BASE_URL}/${id}/activate`).then((r) => r.data)
}

/**
 * Suspend a client subscription.
 */
export async function suspendClientSubscription(id: string): Promise<ClientSubscription> {
  return api.post<ClientSubscription>(`${BASE_URL}/${id}/suspend`).then((r) => r.data)
}

/**
 * Cancel a client subscription.
 */
export async function cancelClientSubscription(id: string): Promise<ClientSubscription> {
  return api.post<ClientSubscription>(`${BASE_URL}/${id}/cancel`).then((r) => r.data)
}

/**
 * Change subscription plan.
 */
export async function changeSubscriptionPlan(
  id: string,
  data: ChangeSubscriptionPlanRequest,
): Promise<ClientSubscription> {
  return api
    .post<ClientSubscription>(`${BASE_URL}/${id}/change-plan`, data)
    .then((r) => r.data)
}

/**
 * Renew a subscription.
 */
export async function renewSubscription(
  id: string,
  data: RenewSubscriptionRequest,
): Promise<ClientSubscription> {
  return api
    .post<ClientSubscription>(`${BASE_URL}/${id}/renew`, data)
    .then((r) => r.data)
}

/**
 * Get subscription statistics.
 */
export async function getSubscriptionStats(): Promise<SubscriptionStats> {
  return api.get<SubscriptionStats>(`${BASE_URL}/stats`).then((r) => r.data)
}
