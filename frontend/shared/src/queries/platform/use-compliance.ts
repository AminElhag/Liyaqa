"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  getContracts,
  getZatcaOverview,
  getZatcaIssues,
  getZatcaMonthlyTrend,
  retryZatcaCompliance,
  getDataRequests,
  processDataRequest,
  type ComplianceContract,
  type ZatcaOverview,
  type ZatcaIssue,
  type ZatcaMonthlyPoint,
  type DataRequest,
} from "../../lib/api/platform/compliance";

export const complianceKeys = {
  all: ["platform", "compliance"] as const,
  contracts: () => [...complianceKeys.all, "contracts"] as const,
  zatcaOverview: () => [...complianceKeys.all, "zatca-overview"] as const,
  zatcaIssues: () => [...complianceKeys.all, "zatca-issues"] as const,
  zatcaTrend: () => [...complianceKeys.all, "zatca-trend"] as const,
  dataRequests: () => [...complianceKeys.all, "data-requests"] as const,
};

export function useContracts(options?: Omit<UseQueryOptions<ComplianceContract[]>, "queryKey" | "queryFn">) {
  return useQuery({ queryKey: complianceKeys.contracts(), queryFn: getContracts, staleTime: 2 * 60 * 1000, ...options });
}

export function useZatcaOverview(options?: Omit<UseQueryOptions<ZatcaOverview>, "queryKey" | "queryFn">) {
  return useQuery({ queryKey: complianceKeys.zatcaOverview(), queryFn: getZatcaOverview, staleTime: 5 * 60 * 1000, ...options });
}

export function useZatcaIssues(options?: Omit<UseQueryOptions<ZatcaIssue[]>, "queryKey" | "queryFn">) {
  return useQuery({ queryKey: complianceKeys.zatcaIssues(), queryFn: () => getZatcaIssues(), staleTime: 2 * 60 * 1000, ...options });
}

export function useZatcaMonthlyTrend(options?: Omit<UseQueryOptions<ZatcaMonthlyPoint[]>, "queryKey" | "queryFn">) {
  return useQuery({ queryKey: complianceKeys.zatcaTrend(), queryFn: () => getZatcaMonthlyTrend(), staleTime: 5 * 60 * 1000, ...options });
}

export function useRetryZatcaCompliance(options?: UseMutationOptions<void, Error, string>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: retryZatcaCompliance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.zatcaIssues() });
      queryClient.invalidateQueries({ queryKey: complianceKeys.zatcaOverview() });
    },
    ...options,
  });
}

export function useDataRequests(options?: Omit<UseQueryOptions<DataRequest[]>, "queryKey" | "queryFn">) {
  return useQuery({ queryKey: complianceKeys.dataRequests(), queryFn: getDataRequests, staleTime: 2 * 60 * 1000, ...options });
}

export function useProcessDataRequest(options?: UseMutationOptions<DataRequest, Error, { id: string; action: "approve" | "reject"; reason?: string }>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, reason }) => processDataRequest(id, action, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.dataRequests() });
    },
    ...options,
  });
}

export type { ComplianceContract, ZatcaOverview, ZatcaIssue, ZatcaMonthlyPoint, DataRequest };
