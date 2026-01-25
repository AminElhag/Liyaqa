import { api } from "./client";
import type { PaginatedResponse, UUID } from "@/types/api";
import type {
  Webhook,
  WebhookWithSecret,
  WebhookDelivery,
  WebhookDeliveryDetail,
  WebhookStats,
  CreateWebhookRequest,
  UpdateWebhookRequest,
  TestWebhookRequest,
  EventTypesResponse,
} from "@/types/webhook";

export interface WebhookQueryParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export interface DeliveryQueryParams {
  page?: number;
  size?: number;
}

/**
 * Get paginated webhooks
 */
export async function getWebhooks(
  params: WebhookQueryParams = {}
): Promise<PaginatedResponse<Webhook>> {
  const searchParams = new URLSearchParams();

  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortDir) searchParams.set("sortDir", params.sortDir);

  const queryString = searchParams.toString();
  const url = queryString ? `api/webhooks?${queryString}` : "api/webhooks";

  return api.get(url).json();
}

/**
 * Get a single webhook by ID
 */
export async function getWebhook(id: UUID): Promise<Webhook> {
  return api.get(`api/webhooks/${id}`).json();
}

/**
 * Create a new webhook
 */
export async function createWebhook(
  data: CreateWebhookRequest
): Promise<WebhookWithSecret> {
  return api.post("api/webhooks", { json: data }).json();
}

/**
 * Update a webhook
 */
export async function updateWebhook(
  id: UUID,
  data: UpdateWebhookRequest
): Promise<Webhook> {
  return api.put(`api/webhooks/${id}`, { json: data }).json();
}

/**
 * Delete a webhook
 */
export async function deleteWebhook(id: UUID): Promise<void> {
  await api.delete(`api/webhooks/${id}`);
}

/**
 * Activate a webhook
 */
export async function activateWebhook(id: UUID): Promise<Webhook> {
  return api.post(`api/webhooks/${id}/activate`).json();
}

/**
 * Deactivate a webhook
 */
export async function deactivateWebhook(id: UUID): Promise<Webhook> {
  return api.post(`api/webhooks/${id}/deactivate`).json();
}

/**
 * Regenerate webhook secret
 */
export async function regenerateWebhookSecret(
  id: UUID
): Promise<WebhookWithSecret> {
  return api.post(`api/webhooks/${id}/regenerate-secret`).json();
}

/**
 * Send a test webhook
 */
export async function testWebhook(
  id: UUID,
  data?: TestWebhookRequest
): Promise<WebhookDelivery> {
  return api.post(`api/webhooks/${id}/test`, { json: data || {} }).json();
}

/**
 * Get delivery history for a webhook
 */
export async function getWebhookDeliveries(
  webhookId: UUID,
  params: DeliveryQueryParams = {}
): Promise<PaginatedResponse<WebhookDelivery>> {
  const searchParams = new URLSearchParams();

  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  const queryString = searchParams.toString();
  const url = queryString
    ? `api/webhooks/${webhookId}/deliveries?${queryString}`
    : `api/webhooks/${webhookId}/deliveries`;

  return api.get(url).json();
}

/**
 * Get delivery details
 */
export async function getWebhookDelivery(
  webhookId: UUID,
  deliveryId: UUID
): Promise<WebhookDeliveryDetail> {
  return api.get(`api/webhooks/${webhookId}/deliveries/${deliveryId}`).json();
}

/**
 * Retry a failed delivery
 */
export async function retryWebhookDelivery(
  webhookId: UUID,
  deliveryId: UUID
): Promise<WebhookDelivery> {
  return api
    .post(`api/webhooks/${webhookId}/deliveries/${deliveryId}/retry`)
    .json();
}

/**
 * Get webhook statistics
 */
export async function getWebhookStats(webhookId: UUID): Promise<WebhookStats> {
  return api.get(`api/webhooks/${webhookId}/stats`).json();
}

/**
 * Get available event types
 */
export async function getEventTypes(): Promise<EventTypesResponse> {
  return api.get("api/webhooks/event-types").json();
}
