import { api } from "../client";
import type { PageResponse } from "@/types/api";
import type {
  ClientPlan,
  ClientPlanSummary,
  CreateClientPlanRequest,
  UpdateClientPlanRequest,
  ClientPlanQueryParams,
} from "@/types/platform";

const BASE_URL = "api/platform/plans";

/**
 * Create a new client plan
 */
export async function createClientPlan(data: CreateClientPlanRequest): Promise<ClientPlan> {
  return api.post(BASE_URL, { json: data }).json<ClientPlan>();
}

/**
 * Get client plan by ID
 */
export async function getClientPlan(id: string): Promise<ClientPlan> {
  return api.get(`${BASE_URL}/${id}`).json<ClientPlan>();
}

/**
 * Get all client plans with pagination
 */
export async function getClientPlans(
  params: ClientPlanQueryParams = {}
): Promise<PageResponse<ClientPlan>> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortDirection) searchParams.set("sortDirection", params.sortDirection);
  if (params.isActive !== undefined) searchParams.set("isActive", String(params.isActive));

  return api.get(BASE_URL, { searchParams }).json<PageResponse<ClientPlan>>();
}

/**
 * Get active client plans (for dropdowns)
 */
export async function getActiveClientPlans(): Promise<ClientPlanSummary[]> {
  return api.get(`${BASE_URL}/active/list`).json<ClientPlanSummary[]>();
}

/**
 * Update a client plan
 */
export async function updateClientPlan(
  id: string,
  data: UpdateClientPlanRequest
): Promise<ClientPlan> {
  return api.put(`${BASE_URL}/${id}`, { json: data }).json<ClientPlan>();
}

/**
 * Activate a client plan
 */
export async function activateClientPlan(id: string): Promise<ClientPlan> {
  return api.post(`${BASE_URL}/${id}/activate`).json<ClientPlan>();
}

/**
 * Deactivate a client plan
 */
export async function deactivateClientPlan(id: string): Promise<ClientPlan> {
  return api.post(`${BASE_URL}/${id}/deactivate`).json<ClientPlan>();
}

/**
 * Delete a client plan
 */
export async function deleteClientPlan(id: string): Promise<void> {
  await api.delete(`${BASE_URL}/${id}`);
}
