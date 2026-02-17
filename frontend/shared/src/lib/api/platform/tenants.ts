import { api } from "../client";
import type { PageResponse } from "../../../types/api";
import type {
  TenantResponse,
  TenantSummaryResponse,
  OnboardingChecklistResponse,
  DataExportJobResponse,
  DeactivationLogResponse,
  TenantFilters,
  ProvisionTenantRequest,
  UpdateTenantRequest,
  TenantStatus,
} from "../../../types/platform/tenant";

const BASE_URL = "api/v1/platform/tenants";

/**
 * List tenants with filters
 */
export async function listTenants(
  filters?: TenantFilters
): Promise<PageResponse<TenantSummaryResponse>> {
  const searchParams: Record<string, string> = {};
  if (filters?.status) searchParams.status = filters.status;
  if (filters?.search) searchParams.search = filters.search;
  if (filters?.page !== undefined) searchParams.page = String(filters.page);
  if (filters?.size !== undefined) searchParams.size = String(filters.size);
  if (filters?.sortBy) searchParams.sortBy = filters.sortBy;
  if (filters?.sortDirection) searchParams.sortDirection = filters.sortDirection;

  return api.get(BASE_URL, { searchParams }).json<PageResponse<TenantSummaryResponse>>();
}

/**
 * Get tenant by ID
 */
export async function getTenantById(id: string): Promise<TenantResponse> {
  return api.get(`${BASE_URL}/${id}`).json<TenantResponse>();
}

/**
 * Provision a new tenant
 */
export async function provisionTenant(data: ProvisionTenantRequest): Promise<TenantResponse> {
  return api.post(BASE_URL, { json: data }).json<TenantResponse>();
}

/**
 * Update a tenant
 */
export async function updateTenant(id: string, data: UpdateTenantRequest): Promise<TenantResponse> {
  return api.put(`${BASE_URL}/${id}`, { json: data }).json<TenantResponse>();
}

/**
 * Change tenant status
 */
export async function changeTenantStatus(
  id: string,
  status: TenantStatus,
  reason?: string
): Promise<TenantResponse> {
  return api
    .post(`${BASE_URL}/${id}/status`, { json: { status, reason } })
    .json<TenantResponse>();
}

/**
 * Suspend a tenant
 */
export async function suspendTenant(id: string, reason?: string): Promise<TenantResponse> {
  return api
    .post(`${BASE_URL}/${id}/suspend`, { json: reason ? { reason } : undefined })
    .json<TenantResponse>();
}

/**
 * Deactivate a tenant
 */
export async function deactivateTenant(id: string, reason: string): Promise<TenantResponse> {
  return api
    .post(`${BASE_URL}/${id}/deactivate`, { json: { reason } })
    .json<TenantResponse>();
}

/**
 * Archive a tenant
 */
export async function archiveTenant(id: string): Promise<TenantResponse> {
  return api.post(`${BASE_URL}/${id}/archive`).json<TenantResponse>();
}

/**
 * Get onboarding checklist for a tenant
 */
export async function getOnboardingChecklist(tenantId: string): Promise<OnboardingChecklistResponse> {
  return api.get(`${BASE_URL}/${tenantId}/onboarding`).json<OnboardingChecklistResponse>();
}

/**
 * Complete an onboarding step
 */
export async function completeOnboardingStep(
  tenantId: string,
  step: string
): Promise<OnboardingChecklistResponse> {
  return api
    .post(`${BASE_URL}/${tenantId}/onboarding/${step}/complete`)
    .json<OnboardingChecklistResponse>();
}

/**
 * Request data export for a tenant
 */
export async function requestDataExport(tenantId: string): Promise<DataExportJobResponse> {
  return api.post(`${BASE_URL}/${tenantId}/export`).json<DataExportJobResponse>();
}

/**
 * List data exports for a tenant
 */
export async function listDataExports(tenantId: string): Promise<DataExportJobResponse[]> {
  return api.get(`${BASE_URL}/${tenantId}/exports`).json<DataExportJobResponse[]>();
}

/**
 * Get deactivation history for a tenant
 */
export async function getDeactivationHistory(tenantId: string): Promise<DeactivationLogResponse[]> {
  return api.get(`${BASE_URL}/${tenantId}/deactivation-history`).json<DeactivationLogResponse[]>();
}
