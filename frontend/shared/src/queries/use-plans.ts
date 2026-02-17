"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getPlans,
  getActivePlans,
  getPlan,
  createPlan,
  updatePlan,
  deletePlan,
  activatePlan,
  deactivatePlan,
  archivePlan,
  reactivatePlan,
  publishPlan,
  getPlanStats,
  type CreatePlanRequest,
  type UpdatePlanRequest,
  type PlanQueryParams,
} from "../lib/api/plans";
import type { PaginatedResponse, UUID } from "../types/api";
import type { MembershipPlan, PlanStats } from "../types/member";

// Query keys
export const planKeys = {
  all: ["plans"] as const,
  lists: () => [...planKeys.all, "list"] as const,
  list: (params: PlanQueryParams) => [...planKeys.lists(), params] as const,
  active: () => [...planKeys.all, "active"] as const,
  stats: () => [...planKeys.all, "stats"] as const,
  details: () => [...planKeys.all, "detail"] as const,
  detail: (id: UUID) => [...planKeys.details(), id] as const,
};

/**
 * Hook to fetch paginated membership plans
 */
export function usePlans(
  params: PlanQueryParams = {},
  options?: Omit<
    UseQueryOptions<PaginatedResponse<MembershipPlan>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: planKeys.list(params),
    queryFn: () => getPlans(params),
    ...options,
  });
}

/**
 * Hook to fetch all active plans (for dropdowns)
 */
export function useActivePlans(
  options?: Omit<UseQueryOptions<MembershipPlan[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: planKeys.active(),
    queryFn: () => getActivePlans(),
    ...options,
  });
}

/**
 * Hook to fetch a single plan by ID
 */
export function usePlan(
  id: UUID,
  options?: Omit<UseQueryOptions<MembershipPlan>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: planKeys.detail(id),
    queryFn: () => getPlan(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook to create a new plan
 */
export function useCreatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePlanRequest) => createPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
      queryClient.invalidateQueries({ queryKey: planKeys.active() });
    },
  });
}

/**
 * Hook to update a plan
 */
export function useUpdatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UpdatePlanRequest }) =>
      updatePlan(id, data),
    onSuccess: (updatedPlan) => {
      queryClient.setQueryData(planKeys.detail(updatedPlan.id), updatedPlan);
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
      queryClient.invalidateQueries({ queryKey: planKeys.active() });
    },
  });
}

/**
 * Hook to delete a plan
 */
export function useDeletePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => deletePlan(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: planKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
      queryClient.invalidateQueries({ queryKey: planKeys.active() });
    },
  });
}

/**
 * Hook to activate a plan
 */
export function useActivatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => activatePlan(id),
    onSuccess: (updatedPlan) => {
      queryClient.setQueryData(planKeys.detail(updatedPlan.id), updatedPlan);
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
      queryClient.invalidateQueries({ queryKey: planKeys.active() });
    },
  });
}

/**
 * Hook to deactivate a plan
 */
export function useDeactivatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => deactivatePlan(id),
    onSuccess: (updatedPlan) => {
      queryClient.setQueryData(planKeys.detail(updatedPlan.id), updatedPlan);
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
      queryClient.invalidateQueries({ queryKey: planKeys.active() });
      queryClient.invalidateQueries({ queryKey: planKeys.stats() });
    },
  });
}

/**
 * Hook to archive a plan (ACTIVE -> ARCHIVED)
 */
export function useArchivePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => archivePlan(id),
    onSuccess: (updatedPlan) => {
      queryClient.setQueryData(planKeys.detail(updatedPlan.id), updatedPlan);
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
      queryClient.invalidateQueries({ queryKey: planKeys.active() });
      queryClient.invalidateQueries({ queryKey: planKeys.stats() });
    },
  });
}

/**
 * Hook to reactivate an archived plan
 */
export function useReactivatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => reactivatePlan(id),
    onSuccess: (updatedPlan) => {
      queryClient.setQueryData(planKeys.detail(updatedPlan.id), updatedPlan);
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
      queryClient.invalidateQueries({ queryKey: planKeys.active() });
      queryClient.invalidateQueries({ queryKey: planKeys.stats() });
    },
  });
}

/**
 * Hook to publish a draft plan (DRAFT -> ACTIVE)
 */
export function usePublishPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => publishPlan(id),
    onSuccess: (updatedPlan) => {
      queryClient.setQueryData(planKeys.detail(updatedPlan.id), updatedPlan);
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
      queryClient.invalidateQueries({ queryKey: planKeys.active() });
      queryClient.invalidateQueries({ queryKey: planKeys.stats() });
    },
  });
}

/**
 * Hook to fetch plan statistics
 */
export function usePlanStats(
  options?: Omit<UseQueryOptions<PlanStats>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: planKeys.stats(),
    queryFn: () => getPlanStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}
