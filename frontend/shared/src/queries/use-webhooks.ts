"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getWebhooks,
  getWebhook,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  activateWebhook,
  deactivateWebhook,
  regenerateWebhookSecret,
  testWebhook,
  getWebhookDeliveries,
  getWebhookDelivery,
  retryWebhookDelivery,
  getWebhookStats,
  getEventTypes,
  type WebhookQueryParams,
  type DeliveryQueryParams,
} from "../lib/api/webhooks";
import type { PaginatedResponse, UUID } from "../types/api";
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
} from "../types/webhook";

// Query keys
export const webhookKeys = {
  all: ["webhooks"] as const,
  lists: () => [...webhookKeys.all, "list"] as const,
  list: (params: WebhookQueryParams) => [...webhookKeys.lists(), params] as const,
  details: () => [...webhookKeys.all, "detail"] as const,
  detail: (id: UUID) => [...webhookKeys.details(), id] as const,
  deliveries: (webhookId: UUID) =>
    [...webhookKeys.all, "deliveries", webhookId] as const,
  deliveryList: (webhookId: UUID, params: DeliveryQueryParams) =>
    [...webhookKeys.deliveries(webhookId), params] as const,
  deliveryDetail: (webhookId: UUID, deliveryId: UUID) =>
    [...webhookKeys.deliveries(webhookId), "detail", deliveryId] as const,
  stats: (webhookId: UUID) =>
    [...webhookKeys.all, "stats", webhookId] as const,
  eventTypes: () => [...webhookKeys.all, "eventTypes"] as const,
};

/**
 * Hook to fetch paginated webhooks list
 */
export function useWebhooks(
  params: WebhookQueryParams = {},
  options?: Omit<
    UseQueryOptions<PaginatedResponse<Webhook>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: webhookKeys.list(params),
    queryFn: () => getWebhooks(params),
    ...options,
  });
}

/**
 * Hook to fetch a single webhook by ID
 */
export function useWebhook(
  id: UUID,
  options?: Omit<UseQueryOptions<Webhook>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: webhookKeys.detail(id),
    queryFn: () => getWebhook(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook to create a new webhook
 */
export function useCreateWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWebhookRequest) => createWebhook(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.lists() });
    },
  });
}

/**
 * Hook to update a webhook
 */
export function useUpdateWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UpdateWebhookRequest }) =>
      updateWebhook(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.lists() });
      queryClient.invalidateQueries({ queryKey: webhookKeys.detail(id) });
    },
  });
}

/**
 * Hook to delete a webhook
 */
export function useDeleteWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => deleteWebhook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.lists() });
    },
  });
}

/**
 * Hook to activate a webhook
 */
export function useActivateWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => activateWebhook(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.lists() });
      queryClient.invalidateQueries({ queryKey: webhookKeys.detail(id) });
    },
  });
}

/**
 * Hook to deactivate a webhook
 */
export function useDeactivateWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => deactivateWebhook(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.lists() });
      queryClient.invalidateQueries({ queryKey: webhookKeys.detail(id) });
    },
  });
}

/**
 * Hook to regenerate webhook secret
 */
export function useRegenerateWebhookSecret() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => regenerateWebhookSecret(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.detail(id) });
    },
  });
}

/**
 * Hook to test a webhook
 */
export function useTestWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data?: TestWebhookRequest }) =>
      testWebhook(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.deliveries(id) });
      queryClient.invalidateQueries({ queryKey: webhookKeys.stats(id) });
    },
  });
}

/**
 * Hook to fetch webhook deliveries
 */
export function useWebhookDeliveries(
  webhookId: UUID,
  params: DeliveryQueryParams = {},
  options?: Omit<
    UseQueryOptions<PaginatedResponse<WebhookDelivery>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: webhookKeys.deliveryList(webhookId, params),
    queryFn: () => getWebhookDeliveries(webhookId, params),
    enabled: !!webhookId,
    ...options,
  });
}

/**
 * Hook to fetch a single delivery
 */
export function useWebhookDelivery(
  webhookId: UUID,
  deliveryId: UUID,
  options?: Omit<UseQueryOptions<WebhookDeliveryDetail>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: webhookKeys.deliveryDetail(webhookId, deliveryId),
    queryFn: () => getWebhookDelivery(webhookId, deliveryId),
    enabled: !!webhookId && !!deliveryId,
    ...options,
  });
}

/**
 * Hook to retry a failed delivery
 */
export function useRetryWebhookDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      webhookId,
      deliveryId,
    }: {
      webhookId: UUID;
      deliveryId: UUID;
    }) => retryWebhookDelivery(webhookId, deliveryId),
    onSuccess: (_, { webhookId, deliveryId }) => {
      queryClient.invalidateQueries({
        queryKey: webhookKeys.deliveries(webhookId),
      });
      queryClient.invalidateQueries({
        queryKey: webhookKeys.deliveryDetail(webhookId, deliveryId),
      });
      queryClient.invalidateQueries({
        queryKey: webhookKeys.stats(webhookId),
      });
    },
  });
}

/**
 * Hook to fetch webhook stats
 */
export function useWebhookStats(
  webhookId: UUID,
  options?: Omit<UseQueryOptions<WebhookStats>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: webhookKeys.stats(webhookId),
    queryFn: () => getWebhookStats(webhookId),
    enabled: !!webhookId,
    ...options,
  });
}

/**
 * Hook to fetch available event types
 */
export function useEventTypes(
  options?: Omit<UseQueryOptions<EventTypesResponse>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: webhookKeys.eventTypes(),
    queryFn: () => getEventTypes(),
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    ...options,
  });
}
