"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  createClientPlan,
  getClientPlan,
  getClientPlans,
  getActiveClientPlans,
  updateClientPlan,
  activateClientPlan,
  deactivateClientPlan,
  deleteClientPlan,
} from "@/lib/api/platform/client-plans";
import type { PageResponse, UUID } from "@/types/api";
import type {
  ClientPlan,
  ClientPlanSummary,
  CreateClientPlanRequest,
  UpdateClientPlanRequest,
  ClientPlanQueryParams,
} from "@/types/platform";

// Query keys
export const clientPlanKeys = {
  all: ["platform", "clientPlans"] as const,
  lists: () => [...clientPlanKeys.all, "list"] as const,
  list: (params: ClientPlanQueryParams) => [...clientPlanKeys.lists(), params] as const,
  active: () => [...clientPlanKeys.all, "active"] as const,
  details: () => [...clientPlanKeys.all, "detail"] as const,
  detail: (id: UUID) => [...clientPlanKeys.details(), id] as const,
};

/**
 * Hook to fetch paginated client plans list
 */
export function useClientPlans(
  params: ClientPlanQueryParams = {},
  options?: Omit<UseQueryOptions<PageResponse<ClientPlan>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: clientPlanKeys.list(params),
    queryFn: () => getClientPlans(params),
    ...options,
  });
}

/**
 * Hook to fetch active client plans (for dropdowns)
 */
export function useActiveClientPlans(
  options?: Omit<UseQueryOptions<ClientPlanSummary[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: clientPlanKeys.active(),
    queryFn: () => getActiveClientPlans(),
    ...options,
  });
}

/**
 * Hook to fetch a single client plan by ID
 */
export function useClientPlan(
  id: UUID,
  options?: Omit<UseQueryOptions<ClientPlan>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: clientPlanKeys.detail(id),
    queryFn: () => getClientPlan(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook to create a new client plan
 */
export function useCreateClientPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateClientPlanRequest) => createClientPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientPlanKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientPlanKeys.active() });
    },
  });
}

/**
 * Hook to update a client plan
 */
export function useUpdateClientPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UpdateClientPlanRequest }) =>
      updateClientPlan(id, data),
    onSuccess: (updatedPlan) => {
      queryClient.setQueryData(clientPlanKeys.detail(updatedPlan.id), updatedPlan);
      queryClient.invalidateQueries({ queryKey: clientPlanKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientPlanKeys.active() });
    },
  });
}

/**
 * Hook to activate a client plan
 */
export function useActivateClientPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => activateClientPlan(id),
    onSuccess: (updatedPlan) => {
      queryClient.setQueryData(clientPlanKeys.detail(updatedPlan.id), updatedPlan);
      queryClient.invalidateQueries({ queryKey: clientPlanKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientPlanKeys.active() });
    },
  });
}

/**
 * Hook to deactivate a client plan
 */
export function useDeactivateClientPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => deactivateClientPlan(id),
    onSuccess: (updatedPlan) => {
      queryClient.setQueryData(clientPlanKeys.detail(updatedPlan.id), updatedPlan);
      queryClient.invalidateQueries({ queryKey: clientPlanKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientPlanKeys.active() });
    },
  });
}

/**
 * Hook to delete a client plan
 */
export function useDeleteClientPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => deleteClientPlan(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: clientPlanKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: clientPlanKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientPlanKeys.active() });
    },
  });
}
