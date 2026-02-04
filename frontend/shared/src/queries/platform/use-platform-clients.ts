"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  onboardClient,
  getClient,
  getClients,
  getClientStats,
  getClientHealth,
  activateClient,
  suspendClient,
  setupAdmin,
  getClientClubs,
  createClientClub,
} from "../lib/api/platform/clients";
import { useToast } from "../hooks/use-toast";
import type { ClientHealth } from "../types/platform/client-health";
import type { PageResponse, UUID } from "../types/api";
import type {
  Client,
  ClientClub,
  OnboardingResult,
  AdminUser,
  ClientStats,
  OnboardClientRequest,
  SetupAdminRequest,
  CreateClientClubRequest,
  ClientQueryParams,
} from "../types/platform";

// Query keys
export const platformClientKeys = {
  all: ["platform", "clients"] as const,
  lists: () => [...platformClientKeys.all, "list"] as const,
  list: (params: ClientQueryParams) => [...platformClientKeys.lists(), params] as const,
  details: () => [...platformClientKeys.all, "detail"] as const,
  detail: (id: UUID) => [...platformClientKeys.details(), id] as const,
  stats: () => [...platformClientKeys.all, "stats"] as const,
  clubs: (organizationId: UUID) => [...platformClientKeys.all, organizationId, "clubs"] as const,
  health: (id: UUID) => [...platformClientKeys.all, "health", id] as const,
};

/**
 * Hook to fetch paginated clients list
 */
export function usePlatformClients(
  params: ClientQueryParams = {},
  options?: Omit<UseQueryOptions<PageResponse<Client>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: platformClientKeys.list(params),
    queryFn: () => getClients(params),
    ...options,
  });
}

/**
 * Hook to fetch a single client by ID
 */
export function usePlatformClient(
  id: UUID,
  options?: Omit<UseQueryOptions<Client>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: platformClientKeys.detail(id),
    queryFn: () => getClient(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook to fetch client statistics
 */
export function usePlatformClientStats(
  options?: Omit<UseQueryOptions<ClientStats>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: platformClientKeys.stats(),
    queryFn: () => getClientStats(),
    ...options,
  });
}

/**
 * Hook to fetch client clubs
 */
export function useClientClubs(
  organizationId: UUID,
  params: { page?: number; size?: number } = {},
  options?: Omit<UseQueryOptions<PageResponse<ClientClub>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: platformClientKeys.clubs(organizationId),
    queryFn: () => getClientClubs(organizationId, params),
    enabled: !!organizationId,
    ...options,
  });
}

/**
 * Hook to fetch client health indicators
 */
export function useClientHealth(
  id: UUID,
  options?: Omit<UseQueryOptions<ClientHealth>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: platformClientKeys.health(id),
    queryFn: () => getClientHealth(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook to onboard a new client
 * Note: Error handling is done in the page component using mutateAsync + parseApiError
 * to properly extract and display backend error messages.
 */
export function useOnboardClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: OnboardClientRequest) => onboardClient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformClientKeys.lists() });
      queryClient.invalidateQueries({ queryKey: platformClientKeys.stats() });
    },
  });
}

/**
 * Hook to activate a client with optimistic updates
 */
export function useActivateClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: UUID) => activateClient(id),
    // Optimistic update
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: platformClientKeys.lists() });
      await queryClient.cancelQueries({ queryKey: platformClientKeys.detail(id) });

      // Snapshot current state
      const previousDetail = queryClient.getQueryData<Client>(
        platformClientKeys.detail(id)
      );
      const previousLists = queryClient.getQueriesData<PageResponse<Client>>({
        queryKey: platformClientKeys.lists(),
      });

      // Optimistically update detail
      if (previousDetail) {
        queryClient.setQueryData(platformClientKeys.detail(id), {
          ...previousDetail,
          status: "ACTIVE",
        });
      }

      // Optimistically update lists
      queryClient.setQueriesData<PageResponse<Client>>(
        { queryKey: platformClientKeys.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            content: old.content.map((client) =>
              client.id === id ? { ...client, status: "ACTIVE" as const } : client
            ),
          };
        }
      );

      return { previousDetail, previousLists };
    },
    onError: (error: Error, id, context) => {
      // Rollback on error
      if (context?.previousDetail) {
        queryClient.setQueryData(platformClientKeys.detail(id), context.previousDetail);
      }
      context?.previousLists?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });

      toast({
        title: "Failed to activate client",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
    onSuccess: (updatedClient) => {
      queryClient.setQueryData(
        platformClientKeys.detail(updatedClient.id),
        updatedClient
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: platformClientKeys.lists() });
      queryClient.invalidateQueries({ queryKey: platformClientKeys.stats() });
    },
  });
}

/**
 * Hook to suspend a client with optimistic updates
 */
export function useSuspendClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: UUID) => suspendClient(id),
    // Optimistic update
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: platformClientKeys.lists() });
      await queryClient.cancelQueries({ queryKey: platformClientKeys.detail(id) });

      const previousDetail = queryClient.getQueryData<Client>(
        platformClientKeys.detail(id)
      );
      const previousLists = queryClient.getQueriesData<PageResponse<Client>>({
        queryKey: platformClientKeys.lists(),
      });

      if (previousDetail) {
        queryClient.setQueryData(platformClientKeys.detail(id), {
          ...previousDetail,
          status: "SUSPENDED",
        });
      }

      queryClient.setQueriesData<PageResponse<Client>>(
        { queryKey: platformClientKeys.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            content: old.content.map((client) =>
              client.id === id ? { ...client, status: "SUSPENDED" as const } : client
            ),
          };
        }
      );

      return { previousDetail, previousLists };
    },
    onError: (error: Error, id, context) => {
      if (context?.previousDetail) {
        queryClient.setQueryData(platformClientKeys.detail(id), context.previousDetail);
      }
      context?.previousLists?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });

      toast({
        title: "Failed to suspend client",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
    onSuccess: (updatedClient) => {
      queryClient.setQueryData(
        platformClientKeys.detail(updatedClient.id),
        updatedClient
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: platformClientKeys.lists() });
      queryClient.invalidateQueries({ queryKey: platformClientKeys.stats() });
    },
  });
}

/**
 * Hook to setup admin user for a client
 */
export function useSetupAdmin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      organizationId,
      data,
    }: {
      organizationId: UUID;
      data: SetupAdminRequest;
    }) => setupAdmin(organizationId, data),
    onSuccess: (_, { organizationId }) => {
      queryClient.invalidateQueries({
        queryKey: platformClientKeys.detail(organizationId),
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to setup admin",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook to create a club for a client
 */
export function useCreateClientClub() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      organizationId,
      data,
    }: {
      organizationId: UUID;
      data: CreateClientClubRequest;
    }) => createClientClub(organizationId, data),
    onSuccess: (_, { organizationId }) => {
      queryClient.invalidateQueries({
        queryKey: platformClientKeys.clubs(organizationId),
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create club",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });
}
