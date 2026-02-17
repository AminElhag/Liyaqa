"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  startImpersonation,
  endImpersonation,
  getActiveSessions,
  getSessionHistory,
  forceEndSession,
} from "../../lib/api/platform/impersonation";
import type { PageResponse } from "../../types/api";
import type {
  ImpersonationSessionResponse,
  ActiveSessionsResponse,
  StartImpersonationRequest,
  ImpersonationFilters,
} from "../../types/platform/impersonation";

export const impersonationKeys = {
  all: ["platform", "impersonation"] as const,
  active: () => [...impersonationKeys.all, "active"] as const,
  history: (filters?: ImpersonationFilters) => [...impersonationKeys.all, "history", filters] as const,
};

export function useActiveSessions(
  options?: Omit<UseQueryOptions<ActiveSessionsResponse>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: impersonationKeys.active(),
    queryFn: getActiveSessions,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
    ...options,
  });
}

export function useSessionHistory(
  filters?: ImpersonationFilters,
  options?: Omit<UseQueryOptions<PageResponse<ImpersonationSessionResponse>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: impersonationKeys.history(filters),
    queryFn: () => getSessionHistory(filters),
    staleTime: 2 * 60 * 1000,
    ...options,
  });
}

export function useStartImpersonation(
  options?: UseMutationOptions<ImpersonationSessionResponse, Error, StartImpersonationRequest>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: startImpersonation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: impersonationKeys.active() });
    },
    ...options,
  });
}

export function useEndImpersonation(
  options?: UseMutationOptions<void, Error, void>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: endImpersonation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: impersonationKeys.all });
    },
    ...options,
  });
}

export function useForceEndSession(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: forceEndSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: impersonationKeys.all });
    },
    ...options,
  });
}
