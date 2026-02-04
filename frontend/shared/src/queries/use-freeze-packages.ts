"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getFreezePackages,
  getFreezePackage,
  getActiveFreezePackages,
  createFreezePackage,
  updateFreezePackage,
  activateFreezePackage,
  deactivateFreezePackage,
  getSubscriptionFreezeBalance,
  purchaseFreezeDays,
  grantFreezeDays,
  freezeSubscriptionWithTracking,
  unfreezeSubscriptionWithTracking,
  getSubscriptionFreezeHistory,
  getActiveFreeze,
} from "../lib/api/freeze-packages";
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

// Query keys
export const freezePackageKeys = {
  all: ["freezePackages"] as const,
  lists: () => [...freezePackageKeys.all, "list"] as const,
  list: (params: FreezePackageQueryParams) =>
    [...freezePackageKeys.lists(), params] as const,
  details: () => [...freezePackageKeys.all, "detail"] as const,
  detail: (id: UUID) => [...freezePackageKeys.details(), id] as const,
  active: () => [...freezePackageKeys.all, "active"] as const,
};

export const subscriptionFreezeKeys = {
  all: ["subscriptionFreeze"] as const,
  balance: (subscriptionId: UUID) =>
    [...subscriptionFreezeKeys.all, "balance", subscriptionId] as const,
  history: (subscriptionId: UUID, params?: FreezeHistoryQueryParams) =>
    [...subscriptionFreezeKeys.all, "history", subscriptionId, params] as const,
  active: (subscriptionId: UUID) =>
    [...subscriptionFreezeKeys.all, "active", subscriptionId] as const,
};

// ==========================================
// FREEZE PACKAGE QUERIES (Admin)
// ==========================================

/**
 * Hook to fetch paginated freeze packages list
 */
export function useFreezePackages(
  params: FreezePackageQueryParams = {},
  options?: Omit<
    UseQueryOptions<PaginatedResponse<FreezePackage>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: freezePackageKeys.list(params),
    queryFn: () => getFreezePackages(params),
    ...options,
  });
}

/**
 * Hook to fetch a single freeze package by ID
 */
export function useFreezePackage(
  id: UUID,
  options?: Omit<UseQueryOptions<FreezePackage>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: freezePackageKeys.detail(id),
    queryFn: () => getFreezePackage(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook to fetch only active freeze packages
 */
export function useActiveFreezePackages(
  options?: Omit<UseQueryOptions<FreezePackage[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: freezePackageKeys.active(),
    queryFn: () => getActiveFreezePackages(),
    ...options,
  });
}

// ==========================================
// FREEZE PACKAGE MUTATIONS (Admin)
// ==========================================

/**
 * Hook to create a new freeze package
 */
export function useCreateFreezePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateFreezePackageRequest) => createFreezePackage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: freezePackageKeys.lists() });
      queryClient.invalidateQueries({ queryKey: freezePackageKeys.active() });
    },
  });
}

/**
 * Hook to update a freeze package
 */
export function useUpdateFreezePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: UUID;
      data: UpdateFreezePackageRequest;
    }) => updateFreezePackage(id, data),
    onSuccess: (updatedPackage) => {
      queryClient.setQueryData(
        freezePackageKeys.detail(updatedPackage.id),
        updatedPackage
      );
      queryClient.invalidateQueries({ queryKey: freezePackageKeys.lists() });
      queryClient.invalidateQueries({ queryKey: freezePackageKeys.active() });
    },
  });
}

/**
 * Hook to activate a freeze package
 */
export function useActivateFreezePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => activateFreezePackage(id),
    onSuccess: (updatedPackage) => {
      queryClient.setQueryData(
        freezePackageKeys.detail(updatedPackage.id),
        updatedPackage
      );
      queryClient.invalidateQueries({ queryKey: freezePackageKeys.lists() });
      queryClient.invalidateQueries({ queryKey: freezePackageKeys.active() });
    },
  });
}

/**
 * Hook to deactivate a freeze package
 */
export function useDeactivateFreezePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => deactivateFreezePackage(id),
    onSuccess: (updatedPackage) => {
      queryClient.setQueryData(
        freezePackageKeys.detail(updatedPackage.id),
        updatedPackage
      );
      queryClient.invalidateQueries({ queryKey: freezePackageKeys.lists() });
      queryClient.invalidateQueries({ queryKey: freezePackageKeys.active() });
    },
  });
}

// ==========================================
// SUBSCRIPTION FREEZE QUERIES
// ==========================================

/**
 * Hook to fetch freeze balance for a subscription
 */
export function useSubscriptionFreezeBalance(
  subscriptionId: UUID,
  options?: Omit<UseQueryOptions<FreezeBalance | null>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: subscriptionFreezeKeys.balance(subscriptionId),
    queryFn: () => getSubscriptionFreezeBalance(subscriptionId),
    enabled: !!subscriptionId,
    ...options,
  });
}

/**
 * Hook to fetch freeze history for a subscription
 */
export function useSubscriptionFreezeHistory(
  subscriptionId: UUID,
  params: FreezeHistoryQueryParams = {},
  options?: Omit<
    UseQueryOptions<PaginatedResponse<FreezeHistory>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: subscriptionFreezeKeys.history(subscriptionId, params),
    queryFn: () => getSubscriptionFreezeHistory(subscriptionId, params),
    enabled: !!subscriptionId,
    ...options,
  });
}

/**
 * Hook to fetch active freeze for a subscription
 */
export function useActiveFreeze(
  subscriptionId: UUID,
  options?: Omit<UseQueryOptions<FreezeHistory | null>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: subscriptionFreezeKeys.active(subscriptionId),
    queryFn: () => getActiveFreeze(subscriptionId),
    enabled: !!subscriptionId,
    ...options,
  });
}

// ==========================================
// SUBSCRIPTION FREEZE MUTATIONS
// ==========================================

/**
 * Hook to purchase freeze days from a package
 */
export function usePurchaseFreezeDays() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      subscriptionId,
      memberId,
      data,
    }: {
      subscriptionId: UUID;
      memberId: UUID;
      data: PurchaseFreezeDaysRequest;
    }) => purchaseFreezeDays(subscriptionId, memberId, data),
    onSuccess: (_, { subscriptionId }) => {
      queryClient.invalidateQueries({
        queryKey: subscriptionFreezeKeys.balance(subscriptionId),
      });
    },
  });
}

/**
 * Hook to grant freeze days (promotional, compensation, etc.)
 */
export function useGrantFreezeDays() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      subscriptionId,
      memberId,
      data,
    }: {
      subscriptionId: UUID;
      memberId: UUID;
      data: GrantFreezeDaysRequest;
    }) => grantFreezeDays(subscriptionId, memberId, data),
    onSuccess: (_, { subscriptionId }) => {
      queryClient.invalidateQueries({
        queryKey: subscriptionFreezeKeys.balance(subscriptionId),
      });
    },
  });
}

/**
 * Hook to freeze a subscription
 */
export function useFreezeSubscriptionWithTracking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      subscriptionId,
      data,
    }: {
      subscriptionId: UUID;
      data: FreezeSubscriptionRequest;
    }) => freezeSubscriptionWithTracking(subscriptionId, data),
    onSuccess: (result) => {
      // Invalidate all freeze-related queries for this subscription
      queryClient.invalidateQueries({
        queryKey: subscriptionFreezeKeys.balance(result.subscriptionId),
      });
      queryClient.invalidateQueries({
        queryKey: subscriptionFreezeKeys.active(result.subscriptionId),
      });
      queryClient.invalidateQueries({
        queryKey: [...subscriptionFreezeKeys.all, "history", result.subscriptionId],
      });
      // Also invalidate subscription detail
      queryClient.invalidateQueries({
        queryKey: ["subscriptions", "detail", result.subscriptionId],
      });
    },
  });
}

/**
 * Hook to unfreeze a subscription
 */
export function useUnfreezeSubscriptionWithTracking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (subscriptionId: UUID) => unfreezeSubscriptionWithTracking(subscriptionId),
    onSuccess: (result) => {
      // Invalidate all freeze-related queries for this subscription
      queryClient.invalidateQueries({
        queryKey: subscriptionFreezeKeys.balance(result.subscriptionId),
      });
      queryClient.invalidateQueries({
        queryKey: subscriptionFreezeKeys.active(result.subscriptionId),
      });
      queryClient.invalidateQueries({
        queryKey: [...subscriptionFreezeKeys.all, "history", result.subscriptionId],
      });
      // Also invalidate subscription detail
      queryClient.invalidateQueries({
        queryKey: ["subscriptions", "detail", result.subscriptionId],
      });
    },
  });
}
