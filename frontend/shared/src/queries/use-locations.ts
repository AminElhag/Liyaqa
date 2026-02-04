"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getLocations,
  getLocation,
  getClubLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  activateLocation,
  deactivateLocation,
} from "../lib/api/locations";
import type { PaginatedResponse, UUID } from "../types/api";
import type {
  Location,
  LocationQueryParams,
  CreateLocationRequest,
  UpdateLocationRequest,
} from "../types/organization";

// Query keys
export const locationKeys = {
  all: ["locations"] as const,
  lists: () => [...locationKeys.all, "list"] as const,
  list: (params: LocationQueryParams) =>
    [...locationKeys.lists(), params] as const,
  details: () => [...locationKeys.all, "detail"] as const,
  detail: (id: UUID) => [...locationKeys.details(), id] as const,
  club: (clubId: UUID) => [...locationKeys.all, "club", clubId] as const,
};

/**
 * Hook to fetch paginated locations
 */
export function useLocations(
  params: LocationQueryParams = {},
  options?: Omit<
    UseQueryOptions<PaginatedResponse<Location>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: locationKeys.list(params),
    queryFn: () => getLocations(params),
    ...options,
  });
}

/**
 * Hook to fetch a single location by ID
 */
export function useLocation(
  id: UUID,
  options?: Omit<UseQueryOptions<Location>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: locationKeys.detail(id),
    queryFn: () => getLocation(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook to fetch locations by club ID
 */
export function useClubLocations(
  clubId: UUID,
  params: Omit<LocationQueryParams, "clubId"> = {},
  options?: Omit<
    UseQueryOptions<PaginatedResponse<Location>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: locationKeys.club(clubId),
    queryFn: () => getClubLocations(clubId, params),
    enabled: !!clubId,
    ...options,
  });
}

/**
 * Hook to create a new location
 */
export function useCreateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLocationRequest) => createLocation(data),
    onSuccess: (location) => {
      queryClient.invalidateQueries({ queryKey: locationKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: locationKeys.club(location.clubId),
      });
    },
  });
}

/**
 * Hook to update a location
 */
export function useUpdateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UpdateLocationRequest }) =>
      updateLocation(id, data),
    onSuccess: (location) => {
      queryClient.setQueryData(locationKeys.detail(location.id), location);
      queryClient.invalidateQueries({ queryKey: locationKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: locationKeys.club(location.clubId),
      });
    },
  });
}

/**
 * Hook to delete a location
 */
export function useDeleteLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => deleteLocation(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: locationKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: locationKeys.lists() });
    },
  });
}

/**
 * Hook to activate a location
 */
export function useActivateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => activateLocation(id),
    onSuccess: (location) => {
      queryClient.setQueryData(locationKeys.detail(location.id), location);
      queryClient.invalidateQueries({ queryKey: locationKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: locationKeys.club(location.clubId),
      });
    },
  });
}

/**
 * Hook to deactivate a location
 */
export function useDeactivateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => deactivateLocation(id),
    onSuccess: (location) => {
      queryClient.setQueryData(locationKeys.detail(location.id), location);
      queryClient.invalidateQueries({ queryKey: locationKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: locationKeys.club(location.clubId),
      });
    },
  });
}
