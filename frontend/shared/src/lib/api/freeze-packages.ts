import { api } from "./client";
import { HTTPError } from "ky";
import type { PaginatedResponse, UUID } from "../types/api";
import type {
  FreezePackage,
  FreezeBalance,
  FreezeHistory,
  FreezeResult,
  CreateFreezePackageRequest,
  UpdateFreezePackageRequest,
  FreezeSubscriptionRequest,
  PurchaseFreezeDaysRequest,
  GrantFreezeDaysRequest,
  FreezePackageQueryParams,
  FreezeHistoryQueryParams,
} from "../types/freeze";

const FREEZE_PACKAGES_ENDPOINT = "api/freeze-packages";

/**
 * Build query string from params
 */
function buildFreezePackageQueryString(params: FreezePackageQueryParams): string {
  const searchParams = new URLSearchParams();
  if (params.active !== undefined) searchParams.set("active", String(params.active));
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortDirection) searchParams.set("sortDirection", params.sortDirection);
  return searchParams.toString();
}

function buildHistoryQueryString(params: FreezeHistoryQueryParams): string {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  return searchParams.toString();
}

// ==========================================
// FREEZE PACKAGE CRUD (Admin)
// ==========================================

/**
 * Get paginated list of freeze packages
 */
export async function getFreezePackages(
  params: FreezePackageQueryParams = {}
): Promise<PaginatedResponse<FreezePackage>> {
  const query = buildFreezePackageQueryString(params);
  const url = query ? `${FREEZE_PACKAGES_ENDPOINT}?${query}` : FREEZE_PACKAGES_ENDPOINT;
  return api.get(url).json();
}

/**
 * Get freeze package by ID
 */
export async function getFreezePackage(id: UUID): Promise<FreezePackage> {
  return api.get(`${FREEZE_PACKAGES_ENDPOINT}/${id}`).json();
}

/**
 * Get only active freeze packages
 */
export async function getActiveFreezePackages(): Promise<FreezePackage[]> {
  return api.get(`${FREEZE_PACKAGES_ENDPOINT}/active`).json();
}

/**
 * Create a new freeze package
 */
export async function createFreezePackage(
  data: CreateFreezePackageRequest
): Promise<FreezePackage> {
  return api.post(FREEZE_PACKAGES_ENDPOINT, { json: data }).json();
}

/**
 * Update an existing freeze package
 */
export async function updateFreezePackage(
  id: UUID,
  data: UpdateFreezePackageRequest
): Promise<FreezePackage> {
  return api.put(`${FREEZE_PACKAGES_ENDPOINT}/${id}`, { json: data }).json();
}

/**
 * Activate a freeze package
 */
export async function activateFreezePackage(id: UUID): Promise<FreezePackage> {
  return api.post(`${FREEZE_PACKAGES_ENDPOINT}/${id}/activate`).json();
}

/**
 * Deactivate a freeze package
 */
export async function deactivateFreezePackage(id: UUID): Promise<FreezePackage> {
  return api.post(`${FREEZE_PACKAGES_ENDPOINT}/${id}/deactivate`).json();
}

// ==========================================
// SUBSCRIPTION FREEZE OPERATIONS
// ==========================================

/**
 * Get freeze balance for a subscription
 */
export async function getSubscriptionFreezeBalance(
  subscriptionId: UUID
): Promise<FreezeBalance | null> {
  try {
    return await api.get(`api/subscriptions/${subscriptionId}/freeze/balance`).json();
  } catch (error) {
    // Return null if no balance exists (404)
    if (error instanceof HTTPError && error.response.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Purchase freeze days from a package
 */
export async function purchaseFreezeDays(
  subscriptionId: UUID,
  memberId: UUID,
  data: PurchaseFreezeDaysRequest
): Promise<FreezeBalance> {
  return api
    .post(`api/subscriptions/${subscriptionId}/freeze/purchase?memberId=${memberId}`, {
      json: data,
    })
    .json();
}

/**
 * Grant freeze days (promotional, compensation, etc.)
 */
export async function grantFreezeDays(
  subscriptionId: UUID,
  memberId: UUID,
  data: GrantFreezeDaysRequest
): Promise<FreezeBalance> {
  return api
    .post(`api/subscriptions/${subscriptionId}/freeze/grant?memberId=${memberId}`, {
      json: data,
    })
    .json();
}

/**
 * Freeze a subscription
 */
export async function freezeSubscriptionWithTracking(
  subscriptionId: UUID,
  data: FreezeSubscriptionRequest
): Promise<FreezeResult> {
  return api
    .post(`api/subscriptions/${subscriptionId}/freeze`, { json: data })
    .json();
}

/**
 * Unfreeze a subscription
 */
export async function unfreezeSubscriptionWithTracking(subscriptionId: UUID): Promise<FreezeResult> {
  return api.post(`api/subscriptions/${subscriptionId}/freeze/unfreeze`).json();
}

/**
 * Get freeze history for a subscription
 */
export async function getSubscriptionFreezeHistory(
  subscriptionId: UUID,
  params: FreezeHistoryQueryParams = {}
): Promise<PaginatedResponse<FreezeHistory>> {
  const query = buildHistoryQueryString(params);
  const url = query
    ? `api/subscriptions/${subscriptionId}/freeze/history?${query}`
    : `api/subscriptions/${subscriptionId}/freeze/history`;
  return api.get(url).json();
}

/**
 * Get active freeze for a subscription
 */
export async function getActiveFreeze(subscriptionId: UUID): Promise<FreezeHistory | null> {
  try {
    return await api.get(`api/subscriptions/${subscriptionId}/freeze/active`).json();
  } catch (error) {
    // Return null if no active freeze (404)
    if (error instanceof HTTPError && error.response.status === 404) {
      return null;
    }
    throw error;
  }
}
