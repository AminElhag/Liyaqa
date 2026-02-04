"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  getActiveDunning,
  getDunningSequences,
  getDunningStatistics,
  getDunningDetail,
  getOrganizationDunning,
  retryPayment,
  sendPaymentLink,
  escalateToCsm,
  pauseDunning,
  resumeDunning,
  cancelDunning,
  markAsRecovered,
  addDunningNote,
  getDunningByStatus,
  getRevenueAtRisk,
  type PaginatedDunning,
} from "../../lib/api/platform/dunning";
import type {
  DunningSequence,
  DunningStatistics,
  DunningFilters,
  DunningSequenceStatus,
} from "../../types/platform/dunning";

// Query keys
export const dunningKeys = {
  all: ["platform", "dunning"] as const,
  active: (limit: number) => [...dunningKeys.all, "active", limit] as const,
  list: (filters?: DunningFilters) =>
    [...dunningKeys.all, "list", filters] as const,
  statistics: () => [...dunningKeys.all, "statistics"] as const,
  detail: (dunningId: string) =>
    [...dunningKeys.all, "detail", dunningId] as const,
  organization: (organizationId: string) =>
    [...dunningKeys.all, "organization", organizationId] as const,
  byStatus: (status: DunningSequenceStatus, limit: number) =>
    [...dunningKeys.all, "byStatus", status, limit] as const,
  revenueAtRisk: () => [...dunningKeys.all, "revenueAtRisk"] as const,
};

/**
 * Hook to fetch active dunning sequences
 */
export function useActiveDunning(
  limit: number = 50,
  options?: Omit<UseQueryOptions<DunningSequence[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: dunningKeys.active(limit),
    queryFn: () => getActiveDunning(limit),
    ...options,
  });
}

/**
 * Hook to fetch dunning sequences with filters
 */
export function useDunningSequences(
  filters?: DunningFilters,
  options?: Omit<UseQueryOptions<PaginatedDunning>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: dunningKeys.list(filters),
    queryFn: () => getDunningSequences(filters),
    ...options,
  });
}

/**
 * Hook to fetch dunning statistics
 */
export function useDunningStatistics(
  options?: Omit<UseQueryOptions<DunningStatistics>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: dunningKeys.statistics(),
    queryFn: () => getDunningStatistics(),
    ...options,
  });
}

/**
 * Hook to fetch dunning detail
 */
export function useDunningDetail(
  dunningId: string,
  options?: Omit<UseQueryOptions<DunningSequence>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: dunningKeys.detail(dunningId),
    queryFn: () => getDunningDetail(dunningId),
    enabled: !!dunningId,
    ...options,
  });
}

/**
 * Hook to fetch dunning for organization
 */
export function useOrganizationDunning(
  organizationId: string,
  options?: Omit<UseQueryOptions<DunningSequence[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: dunningKeys.organization(organizationId),
    queryFn: () => getOrganizationDunning(organizationId),
    enabled: !!organizationId,
    ...options,
  });
}

/**
 * Hook to fetch dunning by status
 */
export function useDunningByStatus(
  status: DunningSequenceStatus,
  limit: number = 50,
  options?: Omit<UseQueryOptions<DunningSequence[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: dunningKeys.byStatus(status, limit),
    queryFn: () => getDunningByStatus(status, limit),
    ...options,
  });
}

/**
 * Hook to fetch revenue at risk
 */
export function useRevenueAtRisk(
  options?: Omit<
    UseQueryOptions<{
      total: number;
      byDay: { day: number; amount: number }[];
      currency: string;
    }>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: dunningKeys.revenueAtRisk(),
    queryFn: () => getRevenueAtRisk(),
    ...options,
  });
}

/**
 * Hook to retry payment
 */
export function useRetryPayment(
  options?: UseMutationOptions<
    { success: boolean; message: string; sequence: DunningSequence },
    Error,
    string
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dunningId) => retryPayment(dunningId),
    onSuccess: (data, dunningId) => {
      queryClient.setQueryData(dunningKeys.detail(dunningId), data.sequence);
      queryClient.invalidateQueries({ queryKey: dunningKeys.all });
    },
    ...options,
  });
}

/**
 * Hook to send payment link
 */
export function useSendPaymentLink(
  options?: UseMutationOptions<
    { success: boolean; message: string },
    Error,
    string
  >
) {
  return useMutation({
    mutationFn: (dunningId) => sendPaymentLink(dunningId),
    ...options,
  });
}

/**
 * Hook to escalate to CSM
 */
export function useEscalateToCsm(
  options?: UseMutationOptions<
    DunningSequence,
    Error,
    { dunningId: string; csmId?: string; notes?: string }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dunningId, csmId, notes }) =>
      escalateToCsm(dunningId, csmId, notes),
    onSuccess: (data, { dunningId }) => {
      queryClient.setQueryData(dunningKeys.detail(dunningId), data);
      queryClient.invalidateQueries({ queryKey: dunningKeys.statistics() });
      queryClient.invalidateQueries({ queryKey: dunningKeys.all });
    },
    ...options,
  });
}

/**
 * Hook to pause dunning
 */
export function usePauseDunning(
  options?: UseMutationOptions<
    DunningSequence,
    Error,
    { dunningId: string; reason?: string }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dunningId, reason }) => pauseDunning(dunningId, reason),
    onSuccess: (data, { dunningId }) => {
      queryClient.setQueryData(dunningKeys.detail(dunningId), data);
      queryClient.invalidateQueries({ queryKey: dunningKeys.all });
    },
    ...options,
  });
}

/**
 * Hook to resume dunning
 */
export function useResumeDunning(
  options?: UseMutationOptions<DunningSequence, Error, string>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dunningId) => resumeDunning(dunningId),
    onSuccess: (data, dunningId) => {
      queryClient.setQueryData(dunningKeys.detail(dunningId), data);
      queryClient.invalidateQueries({ queryKey: dunningKeys.all });
    },
    ...options,
  });
}

/**
 * Hook to cancel dunning
 */
export function useCancelDunning(
  options?: UseMutationOptions<
    DunningSequence,
    Error,
    { dunningId: string; reason?: string }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dunningId, reason }) => cancelDunning(dunningId, reason),
    onSuccess: (data, { dunningId }) => {
      queryClient.setQueryData(dunningKeys.detail(dunningId), data);
      queryClient.invalidateQueries({ queryKey: dunningKeys.statistics() });
      queryClient.invalidateQueries({ queryKey: dunningKeys.all });
    },
    ...options,
  });
}

/**
 * Hook to mark as recovered
 */
export function useMarkAsRecovered(
  options?: UseMutationOptions<
    DunningSequence,
    Error,
    { dunningId: string; notes?: string }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dunningId, notes }) => markAsRecovered(dunningId, notes),
    onSuccess: (data, { dunningId }) => {
      queryClient.setQueryData(dunningKeys.detail(dunningId), data);
      queryClient.invalidateQueries({ queryKey: dunningKeys.statistics() });
      queryClient.invalidateQueries({ queryKey: dunningKeys.all });
    },
    ...options,
  });
}

/**
 * Hook to add note to dunning
 */
export function useAddDunningNote(
  options?: UseMutationOptions<
    DunningSequence,
    Error,
    { dunningId: string; note: string }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dunningId, note }) => addDunningNote(dunningId, note),
    onSuccess: (data, { dunningId }) => {
      queryClient.setQueryData(dunningKeys.detail(dunningId), data);
    },
    ...options,
  });
}
