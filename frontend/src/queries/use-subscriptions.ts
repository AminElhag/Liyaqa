"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getSubscriptions,
  getSubscription,
  getMemberSubscriptions,
  createSubscription,
  freezeSubscription,
  unfreezeSubscription,
  cancelSubscription,
  renewSubscription,
  updateSubscription,
  deleteSubscription,
  bulkFreezeSubscriptions,
  bulkUnfreezeSubscriptions,
  bulkCancelSubscriptions,
  type SubscriptionQueryParams,
  type UpdateSubscriptionRequest,
} from "@/lib/api/subscriptions";
import type { PaginatedResponse, UUID } from "@/types/api";
import type { Subscription, CreateSubscriptionRequest } from "@/types/member";
import { memberKeys } from "./use-members";

// Query keys
export const subscriptionKeys = {
  all: ["subscriptions"] as const,
  lists: () => [...subscriptionKeys.all, "list"] as const,
  list: (params: SubscriptionQueryParams) =>
    [...subscriptionKeys.lists(), params] as const,
  details: () => [...subscriptionKeys.all, "detail"] as const,
  detail: (id: UUID) => [...subscriptionKeys.details(), id] as const,
  byMember: (memberId: UUID) =>
    [...subscriptionKeys.all, "member", memberId] as const,
};

/**
 * Hook to fetch paginated subscriptions list
 */
export function useSubscriptions(
  params: SubscriptionQueryParams = {},
  options?: Omit<
    UseQueryOptions<PaginatedResponse<Subscription>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: subscriptionKeys.list(params),
    queryFn: () => getSubscriptions(params),
    ...options,
  });
}

/**
 * Hook to fetch a single subscription by ID
 */
export function useSubscription(
  id: UUID,
  options?: Omit<UseQueryOptions<Subscription>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: subscriptionKeys.detail(id),
    queryFn: () => getSubscription(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook to fetch subscriptions for a specific member
 */
export function useMemberSubscriptions(
  memberId: UUID,
  options?: Omit<UseQueryOptions<Subscription[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: subscriptionKeys.byMember(memberId),
    queryFn: () => getMemberSubscriptions(memberId),
    enabled: !!memberId,
    ...options,
  });
}

/**
 * Hook to create a new subscription
 */
export function useCreateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSubscriptionRequest) => createSubscription(data),
    onSuccess: (newSubscription) => {
      // Invalidate subscriptions list
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() });
      // Invalidate member's subscriptions
      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.byMember(newSubscription.memberId),
      });
      // Invalidate member detail (might have subscription info)
      queryClient.invalidateQueries({
        queryKey: memberKeys.detail(newSubscription.memberId),
      });
    },
  });
}

/**
 * Hook to freeze a subscription
 */
export function useFreezeSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      freezeEndDate,
    }: {
      id: UUID;
      freezeEndDate?: string;
    }) => freezeSubscription(id, freezeEndDate),
    onSuccess: (updatedSubscription) => {
      queryClient.setQueryData(
        subscriptionKeys.detail(updatedSubscription.id),
        updatedSubscription
      );
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.byMember(updatedSubscription.memberId),
      });
    },
  });
}

/**
 * Hook to unfreeze a subscription
 */
export function useUnfreezeSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => unfreezeSubscription(id),
    onSuccess: (updatedSubscription) => {
      queryClient.setQueryData(
        subscriptionKeys.detail(updatedSubscription.id),
        updatedSubscription
      );
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.byMember(updatedSubscription.memberId),
      });
    },
  });
}

/**
 * Hook to cancel a subscription
 */
export function useCancelSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => cancelSubscription(id),
    onSuccess: (updatedSubscription) => {
      queryClient.setQueryData(
        subscriptionKeys.detail(updatedSubscription.id),
        updatedSubscription
      );
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.byMember(updatedSubscription.memberId),
      });
    },
  });
}

/**
 * Hook to renew a subscription
 */
export function useRenewSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => renewSubscription(id),
    onSuccess: (updatedSubscription) => {
      queryClient.setQueryData(
        subscriptionKeys.detail(updatedSubscription.id),
        updatedSubscription
      );
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.byMember(updatedSubscription.memberId),
      });
    },
  });
}

/**
 * Hook for bulk freeze subscriptions
 */
export function useBulkFreezeSubscriptions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ids,
      freezeEndDate,
    }: {
      ids: UUID[];
      freezeEndDate?: string;
    }) => bulkFreezeSubscriptions(ids, freezeEndDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
  });
}

/**
 * Hook for bulk unfreeze subscriptions
 */
export function useBulkUnfreezeSubscriptions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: UUID[]) => bulkUnfreezeSubscriptions(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
  });
}

/**
 * Hook for bulk cancel subscriptions
 */
export function useBulkCancelSubscriptions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: UUID[]) => bulkCancelSubscriptions(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
  });
}

/**
 * Hook to update a subscription
 */
export function useUpdateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UpdateSubscriptionRequest }) =>
      updateSubscription(id, data),
    onSuccess: (updatedSubscription) => {
      queryClient.setQueryData(
        subscriptionKeys.detail(updatedSubscription.id),
        updatedSubscription
      );
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.byMember(updatedSubscription.memberId),
      });
    },
  });
}

/**
 * Hook to delete a subscription (only CANCELLED or EXPIRED)
 */
export function useDeleteSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => deleteSubscription(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: subscriptionKeys.detail(deletedId),
      });
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
  });
}
