"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  createClientSubscription,
  getClientSubscription,
  getClientSubscriptions,
  getSubscriptionsByOrganization,
  updateClientSubscription,
  activateClientSubscription,
  suspendClientSubscription,
  cancelClientSubscription,
  changeSubscriptionPlan,
  renewSubscription,
  getSubscriptionStats,
  subscribeTenant,
  getTenantSubscription,
  changeTenantPlan,
  cancelTenantSubscription,
  renewTenantSubscription,
  getExpiringSubscriptions,
} from "../../lib/api/platform/client-subscriptions";
import type { PageResponse, UUID } from "../../types/api";
import type {
  ClientSubscription,
  ClientSubscriptionSummary,
  SubscriptionStats,
  CreateClientSubscriptionRequest,
  UpdateClientSubscriptionRequest,
  ChangeSubscriptionPlanRequest,
  RenewSubscriptionRequest,
  ClientSubscriptionQueryParams,
} from "../../types/platform";

// Query keys
export const clientSubscriptionKeys = {
  all: ["platform", "clientSubscriptions"] as const,
  lists: () => [...clientSubscriptionKeys.all, "list"] as const,
  list: (params: ClientSubscriptionQueryParams) =>
    [...clientSubscriptionKeys.lists(), params] as const,
  byOrganization: (organizationId: UUID) =>
    [...clientSubscriptionKeys.lists(), "org", organizationId] as const,
  details: () => [...clientSubscriptionKeys.all, "detail"] as const,
  detail: (id: UUID) => [...clientSubscriptionKeys.details(), id] as const,
  stats: () => [...clientSubscriptionKeys.all, "stats"] as const,
  tenantSubscription: (tenantId: string) =>
    [...clientSubscriptionKeys.all, "tenant", tenantId] as const,
  expiring: (days: number) =>
    [...clientSubscriptionKeys.all, "expiring", days] as const,
};

/**
 * Hook to fetch paginated client subscriptions list
 */
export function useClientSubscriptions(
  params: ClientSubscriptionQueryParams = {},
  options?: Omit<
    UseQueryOptions<PageResponse<ClientSubscriptionSummary>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: clientSubscriptionKeys.list(params),
    queryFn: () => getClientSubscriptions(params),
    ...options,
  });
}

/**
 * Hook to fetch subscriptions by organization
 */
export function useSubscriptionsByOrganization(
  organizationId: UUID,
  params: ClientSubscriptionQueryParams = {},
  options?: Omit<
    UseQueryOptions<PageResponse<ClientSubscriptionSummary>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: clientSubscriptionKeys.byOrganization(organizationId),
    queryFn: () => getSubscriptionsByOrganization(organizationId, params),
    enabled: !!organizationId,
    ...options,
  });
}

/**
 * Hook to fetch a single client subscription by ID
 */
export function useClientSubscription(
  id: UUID,
  options?: Omit<UseQueryOptions<ClientSubscription>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: clientSubscriptionKeys.detail(id),
    queryFn: () => getClientSubscription(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook to fetch subscription statistics
 */
export function useSubscriptionStats(
  options?: Omit<UseQueryOptions<SubscriptionStats>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: clientSubscriptionKeys.stats(),
    queryFn: () => getSubscriptionStats(),
    ...options,
  });
}

/**
 * Hook to create a new client subscription
 */
export function useCreateClientSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateClientSubscriptionRequest) =>
      createClientSubscription(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientSubscriptionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientSubscriptionKeys.stats() });
    },
  });
}

/**
 * Hook to update a client subscription
 */
export function useUpdateClientSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: UUID;
      data: UpdateClientSubscriptionRequest;
    }) => updateClientSubscription(id, data),
    onSuccess: (updatedSubscription) => {
      queryClient.setQueryData(
        clientSubscriptionKeys.detail(updatedSubscription.id),
        updatedSubscription
      );
      queryClient.invalidateQueries({ queryKey: clientSubscriptionKeys.lists() });
    },
  });
}

/**
 * Hook to activate a client subscription
 */
export function useActivateClientSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => activateClientSubscription(id),
    onSuccess: (updatedSubscription) => {
      queryClient.setQueryData(
        clientSubscriptionKeys.detail(updatedSubscription.id),
        updatedSubscription
      );
      queryClient.invalidateQueries({ queryKey: clientSubscriptionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientSubscriptionKeys.stats() });
    },
  });
}

/**
 * Hook to suspend a client subscription
 */
export function useSuspendClientSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => suspendClientSubscription(id),
    onSuccess: (updatedSubscription) => {
      queryClient.setQueryData(
        clientSubscriptionKeys.detail(updatedSubscription.id),
        updatedSubscription
      );
      queryClient.invalidateQueries({ queryKey: clientSubscriptionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientSubscriptionKeys.stats() });
    },
  });
}

/**
 * Hook to cancel a client subscription
 */
export function useCancelClientSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => cancelClientSubscription(id),
    onSuccess: (updatedSubscription) => {
      queryClient.setQueryData(
        clientSubscriptionKeys.detail(updatedSubscription.id),
        updatedSubscription
      );
      queryClient.invalidateQueries({ queryKey: clientSubscriptionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientSubscriptionKeys.stats() });
    },
  });
}

/**
 * Hook to change subscription plan
 */
export function useChangeSubscriptionPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: UUID;
      data: ChangeSubscriptionPlanRequest;
    }) => changeSubscriptionPlan(id, data),
    onSuccess: (updatedSubscription) => {
      queryClient.setQueryData(
        clientSubscriptionKeys.detail(updatedSubscription.id),
        updatedSubscription
      );
      queryClient.invalidateQueries({ queryKey: clientSubscriptionKeys.lists() });
    },
  });
}

/**
 * Hook to renew a subscription
 */
export function useRenewSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: RenewSubscriptionRequest }) =>
      renewSubscription(id, data),
    onSuccess: (updatedSubscription) => {
      queryClient.setQueryData(
        clientSubscriptionKeys.detail(updatedSubscription.id),
        updatedSubscription
      );
      queryClient.invalidateQueries({ queryKey: clientSubscriptionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientSubscriptionKeys.stats() });
    },
  });
}

// Tenant-level subscription hooks

/**
 * Hook to get a tenant's subscription
 */
export function useTenantSubscription(
  tenantId: string,
  options?: Omit<UseQueryOptions<ClientSubscription>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: clientSubscriptionKeys.tenantSubscription(tenantId),
    queryFn: () => getTenantSubscription(tenantId),
    enabled: !!tenantId,
    ...options,
  });
}

/**
 * Hook to subscribe a tenant to a plan
 */
export function useSubscribeTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { tenantId: string; planId: string; billingCycle?: string }) =>
      subscribeTenant(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: clientSubscriptionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientSubscriptionKeys.stats() });
    },
  });
}

/**
 * Hook to change a tenant's plan
 */
export function useChangeTenantPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tenantId, newPlanId }: { tenantId: string; newPlanId: string }) =>
      changeTenantPlan(tenantId, { newPlanId }),
    onSuccess: (result, { tenantId }) => {
      queryClient.invalidateQueries({
        queryKey: clientSubscriptionKeys.tenantSubscription(tenantId),
      });
      queryClient.invalidateQueries({ queryKey: clientSubscriptionKeys.lists() });
    },
  });
}

/**
 * Hook to cancel a tenant's subscription
 */
export function useCancelTenantSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tenantId: string) => cancelTenantSubscription(tenantId),
    onSuccess: (_, tenantId) => {
      queryClient.invalidateQueries({
        queryKey: clientSubscriptionKeys.tenantSubscription(tenantId),
      });
      queryClient.invalidateQueries({ queryKey: clientSubscriptionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientSubscriptionKeys.stats() });
    },
  });
}

/**
 * Hook to renew a tenant's subscription
 */
export function useRenewTenantSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tenantId, data }: { tenantId: string; data?: { newEndDate?: string } }) =>
      renewTenantSubscription(tenantId, data),
    onSuccess: (result, { tenantId }) => {
      queryClient.invalidateQueries({
        queryKey: clientSubscriptionKeys.tenantSubscription(tenantId),
      });
      queryClient.invalidateQueries({ queryKey: clientSubscriptionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientSubscriptionKeys.stats() });
    },
  });
}

/**
 * Hook to get expiring subscriptions
 */
export function useExpiringSubscriptions(
  days: number = 30,
  options?: Omit<UseQueryOptions<ClientSubscriptionSummary[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: clientSubscriptionKeys.expiring(days),
    queryFn: () => getExpiringSubscriptions(days),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}
