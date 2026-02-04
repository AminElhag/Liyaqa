import { api } from "./client";
import type { PaginatedResponse, UUID, ListQueryParams } from "../types/api";
import type {
  Subscription,
  SubscriptionStatus,
  CreateSubscriptionRequest,
} from "../types/member";

const SUBSCRIPTIONS_ENDPOINT = "api/subscriptions";

/**
 * Subscription query params
 */
export interface SubscriptionQueryParams extends ListQueryParams {
  memberId?: UUID;
  planId?: UUID;
  status?: SubscriptionStatus;
  expiringBefore?: string;
}

/**
 * Build query string from params
 */
function buildQueryString(params: SubscriptionQueryParams): string {
  const searchParams = new URLSearchParams();
  if (params.memberId) searchParams.set("memberId", params.memberId);
  if (params.planId) searchParams.set("planId", params.planId);
  if (params.status) searchParams.set("status", params.status);
  if (params.expiringBefore)
    searchParams.set("expiringBefore", params.expiringBefore);
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.direction) searchParams.set("direction", params.direction);
  return searchParams.toString();
}

/**
 * Get paginated list of subscriptions
 */
export async function getSubscriptions(
  params: SubscriptionQueryParams = {}
): Promise<PaginatedResponse<Subscription>> {
  const query = buildQueryString(params);
  const url = query
    ? `${SUBSCRIPTIONS_ENDPOINT}?${query}`
    : SUBSCRIPTIONS_ENDPOINT;
  return api.get(url).json();
}

/**
 * Get subscription by ID
 */
export async function getSubscription(id: UUID): Promise<Subscription> {
  return api.get(`${SUBSCRIPTIONS_ENDPOINT}/${id}`).json();
}

/**
 * Get subscriptions for a specific member
 */
export async function getMemberSubscriptions(
  memberId: UUID
): Promise<Subscription[]> {
  const response = await api
    .get(`api/members/${memberId}/subscriptions`)
    .json();

  // Handle both direct array and paginated response formats
  if (Array.isArray(response)) {
    return response;
  }
  // Backend returns paginated response, extract content array
  if (response && typeof response === 'object' && 'content' in response) {
    return (response as PaginatedResponse<Subscription>).content;
  }
  // Fallback to empty array
  return [];
}

/**
 * Create a new subscription
 */
export async function createSubscription(
  data: CreateSubscriptionRequest
): Promise<Subscription> {
  // Ensure all fields with backend defaults are sent explicitly
  // (Jackson 3.0 doesn't handle Kotlin default values properly for missing JSON fields)
  const payload = {
    ...data,
    autoRenew: data.autoRenew ?? false,
    paidCurrency: data.paidCurrency ?? "SAR",
  };
  return api
    .post(`api/members/${data.memberId}/subscriptions`, { json: payload })
    .json();
}

/**
 * Freeze a subscription
 */
export async function freezeSubscription(
  id: UUID,
  freezeEndDate?: string
): Promise<Subscription> {
  const json = freezeEndDate ? { freezeEndDate } : undefined;
  return api.post(`${SUBSCRIPTIONS_ENDPOINT}/${id}/freeze`, { json }).json();
}

/**
 * Unfreeze a subscription
 */
export async function unfreezeSubscription(id: UUID): Promise<Subscription> {
  return api.post(`${SUBSCRIPTIONS_ENDPOINT}/${id}/unfreeze`).json();
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(id: UUID): Promise<Subscription> {
  return api.post(`${SUBSCRIPTIONS_ENDPOINT}/${id}/cancel`).json();
}

/**
 * Renew a subscription
 */
export async function renewSubscription(id: UUID): Promise<Subscription> {
  return api.post(`${SUBSCRIPTIONS_ENDPOINT}/${id}/renew`).json();
}

/**
 * Update subscription request
 */
export interface UpdateSubscriptionRequest {
  autoRenew?: boolean;
  notes?: string;
}

/**
 * Update a subscription
 */
export async function updateSubscription(
  id: UUID,
  data: UpdateSubscriptionRequest
): Promise<Subscription> {
  return api.put(`${SUBSCRIPTIONS_ENDPOINT}/${id}`, { json: data }).json();
}

/**
 * Delete a subscription (only CANCELLED or EXPIRED)
 */
export async function deleteSubscription(id: UUID): Promise<void> {
  await api.delete(`${SUBSCRIPTIONS_ENDPOINT}/${id}`);
}

/**
 * Bulk subscription status change action
 */
export type BulkSubscriptionAction = "FREEZE" | "UNFREEZE" | "CANCEL";

/**
 * Bulk subscription status request (matches backend BulkSubscriptionStatusRequest)
 */
export interface BulkSubscriptionStatusRequest {
  subscriptionIds: UUID[];
  action: BulkSubscriptionAction;
  reason?: string;
  sendNotifications?: boolean;
}

/**
 * Bulk operation response
 */
export interface BulkOperationResponse {
  totalRequested: number;
  successCount: number;
  failureCount: number;
  results: Record<UUID, { success: boolean; message?: string }>;
}

/**
 * Bulk freeze subscriptions
 */
export async function bulkFreezeSubscriptions(
  ids: UUID[],
  reason?: string
): Promise<BulkOperationResponse> {
  return api
    .post(`${SUBSCRIPTIONS_ENDPOINT}/bulk/status`, {
      json: {
        subscriptionIds: ids,
        action: "FREEZE",
        reason,
      } satisfies BulkSubscriptionStatusRequest,
    })
    .json();
}

/**
 * Bulk unfreeze subscriptions
 */
export async function bulkUnfreezeSubscriptions(
  ids: UUID[],
  reason?: string
): Promise<BulkOperationResponse> {
  return api
    .post(`${SUBSCRIPTIONS_ENDPOINT}/bulk/status`, {
      json: {
        subscriptionIds: ids,
        action: "UNFREEZE",
        reason,
      } satisfies BulkSubscriptionStatusRequest,
    })
    .json();
}

/**
 * Bulk cancel subscriptions
 */
export async function bulkCancelSubscriptions(
  ids: UUID[],
  reason?: string
): Promise<BulkOperationResponse> {
  return api
    .post(`${SUBSCRIPTIONS_ENDPOINT}/bulk/status`, {
      json: {
        subscriptionIds: ids,
        action: "CANCEL",
        reason,
      } satisfies BulkSubscriptionStatusRequest,
    })
    .json();
}
