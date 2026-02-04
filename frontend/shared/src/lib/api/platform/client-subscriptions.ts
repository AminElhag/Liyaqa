import { api } from "../client";
import type { PageResponse } from "../types/api";
import type {
  ClientSubscription,
  ClientSubscriptionSummary,
  SubscriptionStats,
  CreateClientSubscriptionRequest,
  UpdateClientSubscriptionRequest,
  ChangeSubscriptionPlanRequest,
  RenewSubscriptionRequest,
  ClientSubscriptionQueryParams,
} from "../types/platform";

const BASE_URL = "api/platform/subscriptions";

/**
 * Create a new client subscription
 */
export async function createClientSubscription(
  data: CreateClientSubscriptionRequest
): Promise<ClientSubscription> {
  return api.post(BASE_URL, { json: data }).json<ClientSubscription>();
}

/**
 * Get client subscription by ID
 */
export async function getClientSubscription(id: string): Promise<ClientSubscription> {
  return api.get(`${BASE_URL}/${id}`).json<ClientSubscription>();
}

/**
 * Get all client subscriptions with pagination
 */
export async function getClientSubscriptions(
  params: ClientSubscriptionQueryParams = {}
): Promise<PageResponse<ClientSubscriptionSummary>> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortDirection) searchParams.set("sortDirection", params.sortDirection);
  if (params.status) searchParams.set("status", params.status);
  if (params.organizationId) searchParams.set("organizationId", params.organizationId);

  return api.get(BASE_URL, { searchParams }).json<PageResponse<ClientSubscriptionSummary>>();
}

/**
 * Get subscriptions by organization
 */
export async function getSubscriptionsByOrganization(
  organizationId: string,
  params: ClientSubscriptionQueryParams = {}
): Promise<PageResponse<ClientSubscriptionSummary>> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  return api
    .get(`${BASE_URL}/organization/${organizationId}`, { searchParams })
    .json<PageResponse<ClientSubscriptionSummary>>();
}

/**
 * Update a client subscription
 */
export async function updateClientSubscription(
  id: string,
  data: UpdateClientSubscriptionRequest
): Promise<ClientSubscription> {
  return api.put(`${BASE_URL}/${id}`, { json: data }).json<ClientSubscription>();
}

/**
 * Activate a client subscription
 */
export async function activateClientSubscription(id: string): Promise<ClientSubscription> {
  return api.post(`${BASE_URL}/${id}/activate`).json<ClientSubscription>();
}

/**
 * Suspend a client subscription
 */
export async function suspendClientSubscription(id: string): Promise<ClientSubscription> {
  return api.post(`${BASE_URL}/${id}/suspend`).json<ClientSubscription>();
}

/**
 * Cancel a client subscription
 */
export async function cancelClientSubscription(id: string): Promise<ClientSubscription> {
  return api.post(`${BASE_URL}/${id}/cancel`).json<ClientSubscription>();
}

/**
 * Change subscription plan
 */
export async function changeSubscriptionPlan(
  id: string,
  data: ChangeSubscriptionPlanRequest
): Promise<ClientSubscription> {
  return api.post(`${BASE_URL}/${id}/change-plan`, { json: data }).json<ClientSubscription>();
}

/**
 * Renew a subscription
 */
export async function renewSubscription(
  id: string,
  data: RenewSubscriptionRequest
): Promise<ClientSubscription> {
  return api.post(`${BASE_URL}/${id}/renew`, { json: data }).json<ClientSubscription>();
}

/**
 * Get subscription statistics
 */
export async function getSubscriptionStats(): Promise<SubscriptionStats> {
  return api.get(`${BASE_URL}/stats`).json<SubscriptionStats>();
}
