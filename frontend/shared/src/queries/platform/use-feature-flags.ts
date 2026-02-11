"use client";

import {
  useQuery,
  useQueries,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getFeatureFlags,
  updateFeatureFlag,
  setTenantOverride,
  removeTenantOverride,
  getEffectiveFeatures,
  getTenants,
} from "../../lib/api/platform/feature-flags";
import type {
  FeatureFlagsByCategoryResponse,
  FeatureFlagResponse,
  TenantFeatureOverrideResponse,
  EffectiveFeaturesResponse,
  UpdateFeatureFlagRequest,
  SetFeatureOverrideRequest,
  TenantSummaryResponse,
} from "../../types/platform/feature-flags";
import type { PaginatedResponse } from "../../types/api";

export const featureFlagKeys = {
  all: ["platform", "feature-flags"] as const,
  list: () => [...featureFlagKeys.all, "list"] as const,
  tenants: () => [...featureFlagKeys.all, "tenants"] as const,
  effective: (tenantId: string) =>
    [...featureFlagKeys.all, "effective", tenantId] as const,
};

/** Fetch all feature flags grouped by category */
export function useFeatureFlags(
  options?: Omit<
    UseQueryOptions<FeatureFlagsByCategoryResponse[]>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: featureFlagKeys.list(),
    queryFn: () => getFeatureFlags(),
    staleTime: 10 * 60 * 1000,
    ...options,
  });
}

/** Fetch active tenants for matrix columns */
export function useActiveTenants(
  options?: Omit<
    UseQueryOptions<PaginatedResponse<TenantSummaryResponse>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: featureFlagKeys.tenants(),
    queryFn: () => getTenants(100),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/** Fetch effective features for a single tenant */
export function useEffectiveFeatures(
  tenantId: string | undefined,
  options?: Omit<
    UseQueryOptions<EffectiveFeaturesResponse>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: featureFlagKeys.effective(tenantId!),
    queryFn: () => getEffectiveFeatures(tenantId!),
    enabled: !!tenantId,
    staleTime: 2 * 60 * 1000,
    ...options,
  });
}

/** Batch-fetch effective features for all tenants in parallel */
export function useAllEffectiveFeatures(tenantIds: string[]) {
  return useQueries({
    queries: tenantIds.map((tenantId) => ({
      queryKey: featureFlagKeys.effective(tenantId),
      queryFn: () => getEffectiveFeatures(tenantId),
      staleTime: 2 * 60 * 1000,
      enabled: tenantIds.length > 0,
    })),
  });
}

/** Mutation: update a feature flag by key */
export function useUpdateFeatureFlag() {
  const queryClient = useQueryClient();
  return useMutation<
    FeatureFlagResponse,
    Error,
    { key: string; data: UpdateFeatureFlagRequest }
  >({
    mutationFn: ({ key, data }) => updateFeatureFlag(key, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: featureFlagKeys.all });
    },
  });
}

/** Mutation: set/update a tenant feature override */
export function useSetTenantOverride() {
  const queryClient = useQueryClient();
  return useMutation<
    TenantFeatureOverrideResponse,
    Error,
    { tenantId: string; data: SetFeatureOverrideRequest }
  >({
    mutationFn: ({ tenantId, data }) => setTenantOverride(tenantId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: featureFlagKeys.effective(variables.tenantId),
      });
    },
  });
}

/** Mutation: remove a tenant feature override (revert to plan default) */
export function useRemoveTenantOverride() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { tenantId: string; featureKey: string }>({
    mutationFn: ({ tenantId, featureKey }) =>
      removeTenantOverride(tenantId, featureKey),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: featureFlagKeys.effective(variables.tenantId),
      });
    },
  });
}
