"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getMembers,
  getMember,
  createMember,
  updateMember,
  deleteMember,
  suspendMember,
  activateMember,
  bulkDeleteMembers,
  bulkSuspendMembers,
  bulkActivateMembers,
} from "@/lib/api/members";
import type { PaginatedResponse, UUID } from "@/types/api";
import type {
  Member,
  CreateMemberRequest,
  UpdateMemberRequest,
  MemberQueryParams,
} from "@/types/member";

// Query keys
export const memberKeys = {
  all: ["members"] as const,
  lists: () => [...memberKeys.all, "list"] as const,
  list: (params: MemberQueryParams) =>
    [...memberKeys.lists(), params] as const,
  details: () => [...memberKeys.all, "detail"] as const,
  detail: (id: UUID) => [...memberKeys.details(), id] as const,
};

/**
 * Hook to fetch paginated members list
 */
export function useMembers(
  params: MemberQueryParams = {},
  options?: Omit<
    UseQueryOptions<PaginatedResponse<Member>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: memberKeys.list(params),
    queryFn: () => getMembers(params),
    ...options,
  });
}

/**
 * Hook to fetch a single member by ID
 */
export function useMember(
  id: UUID,
  options?: Omit<UseQueryOptions<Member>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: memberKeys.detail(id),
    queryFn: () => getMember(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook to create a new member
 */
export function useCreateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMemberRequest) => createMember(data),
    onSuccess: () => {
      // Invalidate members list queries
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
    },
  });
}

/**
 * Hook to update a member
 */
export function useUpdateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UpdateMemberRequest }) =>
      updateMember(id, data),
    onSuccess: (updatedMember) => {
      // Update the member detail cache
      queryClient.setQueryData(
        memberKeys.detail(updatedMember.id),
        updatedMember
      );
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
    },
  });
}

/**
 * Hook to delete a member
 */
export function useDeleteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => deleteMember(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: memberKeys.detail(id) });
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
    },
  });
}

/**
 * Hook to suspend a member
 */
export function useSuspendMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => suspendMember(id),
    onSuccess: (updatedMember) => {
      queryClient.setQueryData(
        memberKeys.detail(updatedMember.id),
        updatedMember
      );
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
    },
  });
}

/**
 * Hook to activate a member
 */
export function useActivateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => activateMember(id),
    onSuccess: (updatedMember) => {
      queryClient.setQueryData(
        memberKeys.detail(updatedMember.id),
        updatedMember
      );
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
    },
  });
}

/**
 * Hook for bulk delete members
 */
export function useBulkDeleteMembers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: UUID[]) => bulkDeleteMembers(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.all });
    },
  });
}

/**
 * Hook for bulk suspend members
 */
export function useBulkSuspendMembers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: UUID[]) => bulkSuspendMembers(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.all });
    },
  });
}

/**
 * Hook for bulk activate members
 */
export function useBulkActivateMembers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: UUID[]) => bulkActivateMembers(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.all });
    },
  });
}
