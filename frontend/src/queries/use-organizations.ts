"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getOrganizations,
  getOrganization,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  activateOrganization,
  suspendOrganization,
  closeOrganization,
} from "@/lib/api/organizations";
import type { PaginatedResponse, UUID } from "@/types/api";
import type {
  Organization,
  OrganizationQueryParams,
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
} from "@/types/organization";

// Query keys
export const organizationKeys = {
  all: ["organizations"] as const,
  lists: () => [...organizationKeys.all, "list"] as const,
  list: (params: OrganizationQueryParams) =>
    [...organizationKeys.lists(), params] as const,
  details: () => [...organizationKeys.all, "detail"] as const,
  detail: (id: UUID) => [...organizationKeys.details(), id] as const,
};

/**
 * Hook to fetch paginated organizations
 */
export function useOrganizations(
  params: OrganizationQueryParams = {},
  options?: Omit<
    UseQueryOptions<PaginatedResponse<Organization>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: organizationKeys.list(params),
    queryFn: () => getOrganizations(params),
    ...options,
  });
}

/**
 * Hook to fetch a single organization by ID
 */
export function useOrganization(
  id: UUID,
  options?: Omit<UseQueryOptions<Organization>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: organizationKeys.detail(id),
    queryFn: () => getOrganization(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook to create a new organization
 */
export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrganizationRequest) => createOrganization(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.lists() });
    },
  });
}

/**
 * Hook to update an organization
 */
export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: UUID;
      data: UpdateOrganizationRequest;
    }) => updateOrganization(id, data),
    onSuccess: (organization) => {
      queryClient.setQueryData(
        organizationKeys.detail(organization.id),
        organization
      );
      queryClient.invalidateQueries({ queryKey: organizationKeys.lists() });
    },
  });
}

/**
 * Hook to delete an organization
 */
export function useDeleteOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => deleteOrganization(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: organizationKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: organizationKeys.lists() });
    },
  });
}

/**
 * Hook to activate an organization
 */
export function useActivateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => activateOrganization(id),
    onSuccess: (organization) => {
      queryClient.setQueryData(
        organizationKeys.detail(organization.id),
        organization
      );
      queryClient.invalidateQueries({ queryKey: organizationKeys.lists() });
    },
  });
}

/**
 * Hook to suspend an organization
 */
export function useSuspendOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => suspendOrganization(id),
    onSuccess: (organization) => {
      queryClient.setQueryData(
        organizationKeys.detail(organization.id),
        organization
      );
      queryClient.invalidateQueries({ queryKey: organizationKeys.lists() });
    },
  });
}

/**
 * Hook to close an organization
 */
export function useCloseOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => closeOrganization(id),
    onSuccess: (organization) => {
      queryClient.setQueryData(
        organizationKeys.detail(organization.id),
        organization
      );
      queryClient.invalidateQueries({ queryKey: organizationKeys.lists() });
    },
  });
}
