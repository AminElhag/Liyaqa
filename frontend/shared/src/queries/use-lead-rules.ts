"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getScoringRules,
  getScoringRule,
  createScoringRule,
  updateScoringRule,
  deleteScoringRule,
  activateScoringRule,
  deactivateScoringRule,
  getScoringStats,
  getAssignmentRules,
  getAssignmentRule,
  createAssignmentRule,
  updateAssignmentRule,
  deleteAssignmentRule,
  activateAssignmentRule,
  deactivateAssignmentRule,
  getAssignmentStats,
} from "../lib/api/lead-rules";
import type { UUID } from "../types/api";
import type {
  ScoringRule,
  CreateScoringRuleRequest,
  UpdateScoringRuleRequest,
  ScoringStats,
  ScoringTriggerType,
  AssignmentRule,
  CreateAssignmentRuleRequest,
  UpdateAssignmentRuleRequest,
  AssignmentStats,
} from "../types/lead-rules";

// ===== Query Keys =====

export const scoringRuleKeys = {
  all: ["scoringRules"] as const,
  lists: () => [...scoringRuleKeys.all, "list"] as const,
  list: (params?: { activeOnly?: boolean; triggerType?: ScoringTriggerType }) =>
    [...scoringRuleKeys.lists(), params] as const,
  details: () => [...scoringRuleKeys.all, "detail"] as const,
  detail: (id: UUID) => [...scoringRuleKeys.details(), id] as const,
  stats: () => [...scoringRuleKeys.all, "stats"] as const,
};

export const assignmentRuleKeys = {
  all: ["assignmentRules"] as const,
  lists: () => [...assignmentRuleKeys.all, "list"] as const,
  list: (params?: { activeOnly?: boolean }) =>
    [...assignmentRuleKeys.lists(), params] as const,
  details: () => [...assignmentRuleKeys.all, "detail"] as const,
  detail: (id: UUID) => [...assignmentRuleKeys.details(), id] as const,
  stats: () => [...assignmentRuleKeys.all, "stats"] as const,
};

// ===== Scoring Rules Hooks =====

/**
 * Hook to fetch all scoring rules
 */
export function useScoringRules(
  params?: { activeOnly?: boolean; triggerType?: ScoringTriggerType },
  options?: Omit<UseQueryOptions<ScoringRule[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: scoringRuleKeys.list(params),
    queryFn: () => getScoringRules(params),
    ...options,
  });
}

/**
 * Hook to fetch a single scoring rule by ID
 */
export function useScoringRule(
  id: UUID,
  options?: Omit<UseQueryOptions<ScoringRule>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: scoringRuleKeys.detail(id),
    queryFn: () => getScoringRule(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook to fetch scoring rule statistics
 */
export function useScoringStats(
  options?: Omit<UseQueryOptions<ScoringStats>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: scoringRuleKeys.stats(),
    queryFn: () => getScoringStats(),
    ...options,
  });
}

/**
 * Hook to create a new scoring rule
 */
export function useCreateScoringRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateScoringRuleRequest) => createScoringRule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scoringRuleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: scoringRuleKeys.stats() });
    },
  });
}

/**
 * Hook to update a scoring rule
 */
export function useUpdateScoringRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UpdateScoringRuleRequest }) =>
      updateScoringRule(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: scoringRuleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: scoringRuleKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: scoringRuleKeys.stats() });
    },
  });
}

/**
 * Hook to delete a scoring rule
 */
export function useDeleteScoringRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => deleteScoringRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scoringRuleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: scoringRuleKeys.stats() });
    },
  });
}

/**
 * Hook to activate a scoring rule
 */
export function useActivateScoringRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => activateScoringRule(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: scoringRuleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: scoringRuleKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: scoringRuleKeys.stats() });
    },
  });
}

/**
 * Hook to deactivate a scoring rule
 */
export function useDeactivateScoringRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => deactivateScoringRule(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: scoringRuleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: scoringRuleKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: scoringRuleKeys.stats() });
    },
  });
}

// ===== Assignment Rules Hooks =====

/**
 * Hook to fetch all assignment rules
 */
export function useAssignmentRules(
  params?: { activeOnly?: boolean },
  options?: Omit<UseQueryOptions<AssignmentRule[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: assignmentRuleKeys.list(params),
    queryFn: () => getAssignmentRules(params),
    ...options,
  });
}

/**
 * Hook to fetch a single assignment rule by ID
 */
export function useAssignmentRule(
  id: UUID,
  options?: Omit<UseQueryOptions<AssignmentRule>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: assignmentRuleKeys.detail(id),
    queryFn: () => getAssignmentRule(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook to fetch assignment rule statistics
 */
export function useAssignmentStats(
  options?: Omit<UseQueryOptions<AssignmentStats>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: assignmentRuleKeys.stats(),
    queryFn: () => getAssignmentStats(),
    ...options,
  });
}

/**
 * Hook to create a new assignment rule
 */
export function useCreateAssignmentRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAssignmentRuleRequest) => createAssignmentRule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentRuleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assignmentRuleKeys.stats() });
    },
  });
}

/**
 * Hook to update an assignment rule
 */
export function useUpdateAssignmentRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UpdateAssignmentRuleRequest }) =>
      updateAssignmentRule(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: assignmentRuleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assignmentRuleKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: assignmentRuleKeys.stats() });
    },
  });
}

/**
 * Hook to delete an assignment rule
 */
export function useDeleteAssignmentRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => deleteAssignmentRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentRuleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assignmentRuleKeys.stats() });
    },
  });
}

/**
 * Hook to activate an assignment rule
 */
export function useActivateAssignmentRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => activateAssignmentRule(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: assignmentRuleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assignmentRuleKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: assignmentRuleKeys.stats() });
    },
  });
}

/**
 * Hook to deactivate an assignment rule
 */
export function useDeactivateAssignmentRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => deactivateAssignmentRule(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: assignmentRuleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assignmentRuleKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: assignmentRuleKeys.stats() });
    },
  });
}
