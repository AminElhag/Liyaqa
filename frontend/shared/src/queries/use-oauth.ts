"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { oauthApi } from "../lib/api/oauth";
import type {
  OAuthProvider,
  OAuthCallbackParams,
  LinkOAuthAccountRequest,
} from "../types/oauth";

/**
 * Query key factory for OAuth
 */
export const oauthKeys = {
  all: ["oauth"] as const,
  providers: (organizationId?: string) =>
    [...oauthKeys.all, "providers", organizationId] as const,
};

/**
 * Hook to fetch OAuth providers
 */
export function useOAuthProviders(
  organizationId?: string,
  options?: Omit<UseQueryOptions<OAuthProvider[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: oauthKeys.providers(organizationId),
    queryFn: () => oauthApi.fetchOAuthProviders(organizationId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Hook to initiate OAuth login
 * This is a mutation that triggers browser redirect
 */
export function useInitiateOAuth() {
  return useMutation({
    mutationFn: ({
      provider,
      organizationId,
    }: {
      provider: string;
      organizationId?: string;
    }) => {
      // This function doesn't return a promise since it redirects
      oauthApi.initiateOAuthLogin(provider, organizationId);
      return Promise.resolve();
    },
  });
}

/**
 * Hook to handle OAuth callback
 */
export function useOAuthCallback() {
  return useMutation({
    mutationFn: (params: OAuthCallbackParams) =>
      oauthApi.handleOAuthCallback(params),
  });
}

/**
 * Hook to link OAuth provider to account
 */
export function useLinkOAuthAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LinkOAuthAccountRequest) =>
      oauthApi.linkOAuthAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: oauthKeys.all });
    },
  });
}

/**
 * Hook to unlink OAuth provider from account
 */
export function useUnlinkOAuthAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (provider: string) => oauthApi.unlinkOAuthAccount(provider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: oauthKeys.all });
    },
  });
}
