import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getClassPacks,
  getActiveClassPacks,
  getClassPack,
  createClassPack,
  updateClassPack,
  activateClassPack,
  deactivateClassPack,
  deleteClassPack,
  getMemberBalances,
  getActiveMemberBalances,
  grantPackToMember,
  cancelBalance,
} from "../lib/api/class-packs";
import type { UUID } from "../types/api";
import type {
  ClassPackStatus,
  ServiceType,
  CreateClassPackRequest,
  UpdateClassPackRequest,
} from "../types/scheduling";

// Query keys
export const classPackKeys = {
  all: ["class-packs"] as const,
  lists: () => [...classPackKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...classPackKeys.lists(), params] as const,
  active: () => [...classPackKeys.all, "active"] as const,
  details: () => [...classPackKeys.all, "detail"] as const,
  detail: (id: UUID) => [...classPackKeys.details(), id] as const,
  memberBalances: (memberId: UUID) =>
    [...classPackKeys.all, "member-balances", memberId] as const,
  memberActiveBalances: (memberId: UUID) =>
    [...classPackKeys.all, "member-active-balances", memberId] as const,
};

/**
 * Hook to fetch paginated class packs
 */
export function useClassPacks(params: {
  page?: number;
  size?: number;
  status?: ClassPackStatus;
  serviceType?: ServiceType;
  sortBy?: string;
  sortDirection?: "ASC" | "DESC";
} = {}) {
  return useQuery({
    queryKey: classPackKeys.list(params),
    queryFn: () => getClassPacks(params),
  });
}

/**
 * Hook to fetch active class packs
 */
export function useActiveClassPacks() {
  return useQuery({
    queryKey: classPackKeys.active(),
    queryFn: getActiveClassPacks,
  });
}

/**
 * Hook to fetch a single class pack
 */
export function useClassPack(id: UUID) {
  return useQuery({
    queryKey: classPackKeys.detail(id),
    queryFn: () => getClassPack(id),
    enabled: !!id,
  });
}

/**
 * Hook to create a class pack
 */
export function useCreateClassPack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateClassPackRequest) => createClassPack(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classPackKeys.all });
    },
  });
}

/**
 * Hook to update a class pack
 */
export function useUpdateClassPack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UpdateClassPackRequest }) =>
      updateClassPack(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: classPackKeys.all });
      queryClient.invalidateQueries({ queryKey: classPackKeys.detail(id) });
    },
  });
}

/**
 * Hook to activate a class pack
 */
export function useActivateClassPack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => activateClassPack(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: classPackKeys.all });
      queryClient.invalidateQueries({ queryKey: classPackKeys.detail(id) });
    },
  });
}

/**
 * Hook to deactivate a class pack
 */
export function useDeactivateClassPack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => deactivateClassPack(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: classPackKeys.all });
      queryClient.invalidateQueries({ queryKey: classPackKeys.detail(id) });
    },
  });
}

/**
 * Hook to delete a class pack
 */
export function useDeleteClassPack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => deleteClassPack(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classPackKeys.all });
    },
  });
}

// ==================== MEMBER BALANCES ====================

/**
 * Hook to fetch member class pack balances
 */
export function useMemberClassPackBalances(
  memberId: UUID,
  params: { page?: number; size?: number } = {}
) {
  return useQuery({
    queryKey: classPackKeys.memberBalances(memberId),
    queryFn: () => getMemberBalances(memberId, params),
    enabled: !!memberId,
  });
}

/**
 * Hook to fetch active member class pack balances
 */
export function useActiveMemberBalances(memberId: UUID) {
  return useQuery({
    queryKey: classPackKeys.memberActiveBalances(memberId),
    queryFn: () => getActiveMemberBalances(memberId),
    enabled: !!memberId,
  });
}

/**
 * Hook to grant a class pack to a member
 */
export function useGrantPackToMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ memberId, classPackId }: { memberId: UUID; classPackId: UUID }) =>
      grantPackToMember(memberId, classPackId),
    onSuccess: (_, { memberId }) => {
      queryClient.invalidateQueries({
        queryKey: classPackKeys.memberBalances(memberId),
      });
      queryClient.invalidateQueries({
        queryKey: classPackKeys.memberActiveBalances(memberId),
      });
    },
  });
}

/**
 * Hook to cancel a member's class pack balance
 */
export function useCancelBalance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (balanceId: UUID) => cancelBalance(balanceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classPackKeys.all });
    },
  });
}
