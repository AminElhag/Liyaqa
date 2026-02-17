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
  getContractById,
  createContract,
  updateContract,
  deleteContract,
  getExpiringContracts,
  renewContract,
  getZatcaOverview,
  getZatcaIssues,
  getZatcaMonthlyTrend,
  retryZatcaCompliance,
  getDataRequests,
  getDataRequestById,
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
  contractDetail: (id: string) => [...complianceKeys.all, "contract", id] as const,
  expiringContracts: (days: number) => [...complianceKeys.all, "expiring-contracts", days] as const,
  zatcaOverview: () => [...complianceKeys.all, "zatca-overview"] as const,
  zatcaIssues: () => [...complianceKeys.all, "zatca-issues"] as const,
  zatcaTrend: () => [...complianceKeys.all, "zatca-trend"] as const,
  dataRequests: () => [...complianceKeys.all, "data-requests"] as const,
  dataRequestDetail: (id: string) => [...complianceKeys.all, "data-request", id] as const,
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

export function useContractById(
  id: string,
  options?: Omit<UseQueryOptions<ComplianceContract>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: complianceKeys.contractDetail(id),
    queryFn: () => getContractById(id),
    enabled: !!id,
    staleTime: 60 * 1000,
    ...options,
  });
}

export function useCreateContract(options?: UseMutationOptions<ComplianceContract, Error, { tenantId: string; type: string; startDate: string; endDate: string; autoRenew?: boolean; value?: number; currency?: string }>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createContract,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.contracts() });
    },
    ...options,
  });
}

export function useUpdateContract(options?: UseMutationOptions<ComplianceContract, Error, { id: string; data: { type?: string; startDate?: string; endDate?: string; autoRenew?: boolean; value?: number; currency?: string } }>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateContract(id, data),
    onSuccess: (result) => {
      queryClient.setQueryData(complianceKeys.contractDetail(result.id), result);
      queryClient.invalidateQueries({ queryKey: complianceKeys.contracts() });
    },
    ...options,
  });
}

export function useDeleteContract(options?: UseMutationOptions<void, Error, string>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteContract,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.contracts() });
    },
    ...options,
  });
}

export function useExpiringContracts(
  days: number = 30,
  options?: Omit<UseQueryOptions<ComplianceContract[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: complianceKeys.expiringContracts(days),
    queryFn: () => getExpiringContracts(days),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useRenewContract(options?: UseMutationOptions<ComplianceContract, Error, { id: string; data: { newEndDate: string; newValue?: number } }>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => renewContract(id, data),
    onSuccess: (result) => {
      queryClient.setQueryData(complianceKeys.contractDetail(result.id), result);
      queryClient.invalidateQueries({ queryKey: complianceKeys.contracts() });
    },
    ...options,
  });
}

export function useDataRequestById(
  id: string,
  options?: Omit<UseQueryOptions<DataRequest>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: complianceKeys.dataRequestDetail(id),
    queryFn: () => getDataRequestById(id),
    enabled: !!id,
    staleTime: 60 * 1000,
    ...options,
  });
}

export type { ComplianceContract, ZatcaOverview, ZatcaIssue, ZatcaMonthlyPoint, DataRequest };
