"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getMemberHealth,
  createMemberHealth,
  updateMemberHealth,
  upsertMemberHealth,
} from "@/lib/api/member-health";
import type { UUID } from "@/types/api";
import type { MemberHealth, CreateHealthRequest, UpdateHealthRequest } from "@/types/health";

// Query keys
export const memberHealthKeys = {
  all: ["memberHealth"] as const,
  detail: (memberId: UUID) => [...memberHealthKeys.all, memberId] as const,
};

/**
 * Hook to fetch member's health information
 */
export function useMemberHealth(
  memberId: UUID,
  options?: Omit<UseQueryOptions<MemberHealth | null>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: memberHealthKeys.detail(memberId),
    queryFn: () => getMemberHealth(memberId),
    enabled: !!memberId,
    ...options,
  });
}

/**
 * Hook to create health information for a member
 */
export function useCreateMemberHealth() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      memberId,
      data,
    }: {
      memberId: UUID;
      data: CreateHealthRequest;
    }) => createMemberHealth(memberId, data),
    onSuccess: (newHealth, { memberId }) => {
      queryClient.setQueryData(memberHealthKeys.detail(memberId), newHealth);
    },
  });
}

/**
 * Hook to update health information for a member
 */
export function useUpdateMemberHealth() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      memberId,
      data,
    }: {
      memberId: UUID;
      data: UpdateHealthRequest;
    }) => updateMemberHealth(memberId, data),
    onSuccess: (updatedHealth, { memberId }) => {
      queryClient.setQueryData(memberHealthKeys.detail(memberId), updatedHealth);
    },
  });
}

/**
 * Hook to create or update health information (upsert)
 */
export function useUpsertMemberHealth() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      memberId,
      data,
    }: {
      memberId: UUID;
      data: CreateHealthRequest;
    }) => upsertMemberHealth(memberId, data),
    onSuccess: (health, { memberId }) => {
      queryClient.setQueryData(memberHealthKeys.detail(memberId), health);
    },
  });
}
