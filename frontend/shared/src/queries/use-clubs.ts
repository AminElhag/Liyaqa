"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getClubs,
  getClub,
  getOrganizationClubs,
  createClub,
  updateClub,
  deleteClub,
  activateClub,
  suspendClub,
  closeClub,
} from "../lib/api/clubs";
import type { PaginatedResponse, UUID } from "../types/api";
import type {
  Club,
  ClubQueryParams,
  CreateClubRequest,
  UpdateClubRequest,
} from "../types/organization";

// Query keys
export const clubKeys = {
  all: ["clubs"] as const,
  lists: () => [...clubKeys.all, "list"] as const,
  list: (params: ClubQueryParams) => [...clubKeys.lists(), params] as const,
  details: () => [...clubKeys.all, "detail"] as const,
  detail: (id: UUID) => [...clubKeys.details(), id] as const,
  organization: (organizationId: UUID) =>
    [...clubKeys.all, "organization", organizationId] as const,
};

/**
 * Hook to fetch paginated clubs
 */
export function useClubs(
  params: ClubQueryParams = {},
  options?: Omit<
    UseQueryOptions<PaginatedResponse<Club>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: clubKeys.list(params),
    queryFn: () => getClubs(params),
    ...options,
  });
}

/**
 * Hook to fetch a single club by ID
 */
export function useClub(
  id: UUID,
  options?: Omit<UseQueryOptions<Club>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: clubKeys.detail(id),
    queryFn: () => getClub(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook to fetch clubs by organization ID
 */
export function useOrganizationClubs(
  organizationId: UUID,
  params: Omit<ClubQueryParams, "organizationId"> = {},
  options?: Omit<
    UseQueryOptions<PaginatedResponse<Club>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: clubKeys.organization(organizationId),
    queryFn: () => getOrganizationClubs(organizationId, params),
    enabled: !!organizationId,
    ...options,
  });
}

/**
 * Hook to create a new club
 */
export function useCreateClub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateClubRequest) => createClub(data),
    onSuccess: (club) => {
      queryClient.invalidateQueries({ queryKey: clubKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: clubKeys.organization(club.organizationId),
      });
    },
  });
}

/**
 * Hook to update a club
 */
export function useUpdateClub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UpdateClubRequest }) =>
      updateClub(id, data),
    onSuccess: (club) => {
      queryClient.setQueryData(clubKeys.detail(club.id), club);
      queryClient.invalidateQueries({ queryKey: clubKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: clubKeys.organization(club.organizationId),
      });
    },
  });
}

/**
 * Hook to delete a club
 */
export function useDeleteClub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => deleteClub(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: clubKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: clubKeys.lists() });
    },
  });
}

/**
 * Hook to activate a club
 */
export function useActivateClub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => activateClub(id),
    onSuccess: (club) => {
      queryClient.setQueryData(clubKeys.detail(club.id), club);
      queryClient.invalidateQueries({ queryKey: clubKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: clubKeys.organization(club.organizationId),
      });
    },
  });
}

/**
 * Hook to suspend a club
 */
export function useSuspendClub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => suspendClub(id),
    onSuccess: (club) => {
      queryClient.setQueryData(clubKeys.detail(club.id), club);
      queryClient.invalidateQueries({ queryKey: clubKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: clubKeys.organization(club.organizationId),
      });
    },
  });
}

/**
 * Hook to close a club
 */
export function useCloseClub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => closeClub(id),
    onSuccess: (club) => {
      queryClient.setQueryData(clubKeys.detail(club.id), club);
      queryClient.invalidateQueries({ queryKey: clubKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: clubKeys.organization(club.organizationId),
      });
    },
  });
}
