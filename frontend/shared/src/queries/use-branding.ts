"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type { BrandingConfig, UpdateBrandingRequest } from "../types/branding";
import { getBrandingConfig, updateBrandingConfig } from "../lib/api/branding";

// Query keys
export const brandingKeys = {
  all: ["branding"] as const,
  config: () => [...brandingKeys.all, "config"] as const,
};

/**
 * Hook to fetch branding configuration.
 */
export function useBrandingConfig(
  options?: Omit<UseQueryOptions<BrandingConfig>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: brandingKeys.config(),
    queryFn: () => getBrandingConfig(),
    ...options,
  });
}

/**
 * Hook to update branding configuration.
 */
export function useUpdateBrandingConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateBrandingRequest) => updateBrandingConfig(data),
    onSuccess: (updatedConfig) => {
      queryClient.setQueryData(brandingKeys.config(), updatedConfig);
    },
  });
}
