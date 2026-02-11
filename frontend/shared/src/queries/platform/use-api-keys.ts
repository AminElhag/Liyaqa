"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  getApiKeys,
  createApiKey,
  revokeApiKey,
  type ApiKey,
  type ApiKeyCreateRequest,
  type ApiKeyCreateResponse,
} from "../../lib/api/platform/api-keys";

export const apiKeyKeys = {
  all: ["platform", "api-keys"] as const,
  list: (tenantId: string) => [...apiKeyKeys.all, "list", tenantId] as const,
};

export function useApiKeys(
  tenantId: string,
  options?: Omit<UseQueryOptions<ApiKey[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: apiKeyKeys.list(tenantId),
    queryFn: () => getApiKeys(tenantId),
    staleTime: 5 * 60 * 1000,
    enabled: !!tenantId,
    ...options,
  });
}

export function useCreateApiKey(
  options?: UseMutationOptions<ApiKeyCreateResponse, Error, { tenantId: string } & ApiKeyCreateRequest>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantId, ...data }) => createApiKey(tenantId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: apiKeyKeys.list(variables.tenantId) });
    },
    ...options,
  });
}

export function useRevokeApiKey(
  tenantId: string,
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => revokeApiKey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiKeyKeys.list(tenantId) });
    },
    ...options,
  });
}

export type { ApiKey, ApiKeyCreateRequest, ApiKeyCreateResponse };
