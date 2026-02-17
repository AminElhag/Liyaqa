"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  listTenants,
  getTenantById,
  provisionTenant,
  updateTenant,
  changeTenantStatus,
  suspendTenant,
  deactivateTenant,
  archiveTenant,
  getOnboardingChecklist,
  completeOnboardingStep,
  requestDataExport,
  listDataExports,
  getDeactivationHistory,
} from "../../lib/api/platform/tenants";
import type { PageResponse } from "../../types/api";
import type {
  TenantResponse,
  TenantSummaryResponse,
  OnboardingChecklistResponse,
  DataExportJobResponse,
  DeactivationLogResponse,
  TenantFilters,
  ProvisionTenantRequest,
  UpdateTenantRequest,
  TenantStatus,
} from "../../types/platform/tenant";

export const tenantKeys = {
  all: ["platform", "tenants"] as const,
  list: (filters?: TenantFilters) => [...tenantKeys.all, "list", filters] as const,
  detail: (id: string) => [...tenantKeys.all, "detail", id] as const,
  onboarding: (id: string) => [...tenantKeys.all, "onboarding", id] as const,
  exports: (id: string) => [...tenantKeys.all, "exports", id] as const,
  deactivationHistory: (id: string) => [...tenantKeys.all, "deactivation-history", id] as const,
};

export function useTenants(
  filters?: TenantFilters,
  options?: Omit<UseQueryOptions<PageResponse<TenantSummaryResponse>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: tenantKeys.list(filters),
    queryFn: () => listTenants(filters),
    staleTime: 2 * 60 * 1000,
    ...options,
  });
}

export function useTenantById(
  id: string,
  options?: Omit<UseQueryOptions<TenantResponse>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: tenantKeys.detail(id),
    queryFn: () => getTenantById(id),
    enabled: !!id,
    staleTime: 60 * 1000,
    ...options,
  });
}

export function useProvisionTenant(
  options?: UseMutationOptions<TenantResponse, Error, ProvisionTenantRequest>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: provisionTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.all });
    },
    ...options,
  });
}

export function useUpdateTenant(
  options?: UseMutationOptions<TenantResponse, Error, { id: string; data: UpdateTenantRequest }>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateTenant(id, data),
    onSuccess: (result) => {
      queryClient.setQueryData(tenantKeys.detail(result.id), result);
      queryClient.invalidateQueries({ queryKey: tenantKeys.all });
    },
    ...options,
  });
}

export function useChangeTenantStatus(
  options?: UseMutationOptions<TenantResponse, Error, { id: string; status: TenantStatus; reason?: string }>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, reason }) => changeTenantStatus(id, status, reason),
    onSuccess: (result) => {
      queryClient.setQueryData(tenantKeys.detail(result.id), result);
      queryClient.invalidateQueries({ queryKey: tenantKeys.all });
    },
    ...options,
  });
}

export function useSuspendTenant(
  options?: UseMutationOptions<TenantResponse, Error, { id: string; reason?: string }>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) => suspendTenant(id, reason),
    onSuccess: (result) => {
      queryClient.setQueryData(tenantKeys.detail(result.id), result);
      queryClient.invalidateQueries({ queryKey: tenantKeys.all });
    },
    ...options,
  });
}

export function useDeactivateTenant(
  options?: UseMutationOptions<TenantResponse, Error, { id: string; reason: string }>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) => deactivateTenant(id, reason),
    onSuccess: (result) => {
      queryClient.setQueryData(tenantKeys.detail(result.id), result);
      queryClient.invalidateQueries({ queryKey: tenantKeys.all });
    },
    ...options,
  });
}

export function useArchiveTenant(
  options?: UseMutationOptions<TenantResponse, Error, string>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: archiveTenant,
    onSuccess: (result) => {
      queryClient.setQueryData(tenantKeys.detail(result.id), result);
      queryClient.invalidateQueries({ queryKey: tenantKeys.all });
    },
    ...options,
  });
}

export function useOnboardingChecklist(
  tenantId: string,
  options?: Omit<UseQueryOptions<OnboardingChecklistResponse>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: tenantKeys.onboarding(tenantId),
    queryFn: () => getOnboardingChecklist(tenantId),
    enabled: !!tenantId,
    staleTime: 2 * 60 * 1000,
    ...options,
  });
}

export function useCompleteOnboardingStep(
  options?: UseMutationOptions<OnboardingChecklistResponse, Error, { tenantId: string; step: string }>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantId, step }) => completeOnboardingStep(tenantId, step),
    onSuccess: (result, { tenantId }) => {
      queryClient.setQueryData(tenantKeys.onboarding(tenantId), result);
    },
    ...options,
  });
}

export function useDataExports(
  tenantId: string,
  options?: Omit<UseQueryOptions<DataExportJobResponse[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: tenantKeys.exports(tenantId),
    queryFn: () => listDataExports(tenantId),
    enabled: !!tenantId,
    ...options,
  });
}

export function useRequestDataExport(
  options?: UseMutationOptions<DataExportJobResponse, Error, string>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: requestDataExport,
    onSuccess: (_, tenantId) => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.exports(tenantId) });
    },
    ...options,
  });
}

export function useDeactivationHistory(
  tenantId: string,
  options?: Omit<UseQueryOptions<DeactivationLogResponse[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: tenantKeys.deactivationHistory(tenantId),
    queryFn: () => getDeactivationHistory(tenantId),
    enabled: !!tenantId,
    ...options,
  });
}
