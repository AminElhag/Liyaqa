"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getAgreements,
  getAgreement,
  getActiveAgreements,
  getMandatoryAgreements,
  createAgreement,
  updateAgreement,
  deleteAgreement,
  activateAgreement,
  deactivateAgreement,
  getMemberAgreements,
  getMemberAgreementStatus,
  signAgreement,
  getMyAgreements,
  getMyAgreementStatus,
  signMyAgreement,
  signMyAgreementsBulk,
} from "@/lib/api/agreements";
import type { PaginatedResponse, UUID } from "@/types/api";
import type {
  Agreement,
  MemberAgreement,
  MemberAgreementStatus,
  CreateAgreementRequest,
  UpdateAgreementRequest,
  SignAgreementRequest,
  AgreementQueryParams,
} from "@/types/agreement";

// Query keys
export const agreementKeys = {
  all: ["agreements"] as const,
  lists: () => [...agreementKeys.all, "list"] as const,
  list: (params: AgreementQueryParams) =>
    [...agreementKeys.lists(), params] as const,
  details: () => [...agreementKeys.all, "detail"] as const,
  detail: (id: UUID) => [...agreementKeys.details(), id] as const,
  active: () => [...agreementKeys.all, "active"] as const,
  mandatory: () => [...agreementKeys.all, "mandatory"] as const,
  member: (memberId: UUID) => [...agreementKeys.all, "member", memberId] as const,
  memberStatus: (memberId: UUID) =>
    [...agreementKeys.all, "member", memberId, "status"] as const,
};

// ==========================================
// AGREEMENT QUERIES (Admin)
// ==========================================

/**
 * Hook to fetch paginated agreements list
 */
export function useAgreements(
  params: AgreementQueryParams = {},
  options?: Omit<
    UseQueryOptions<PaginatedResponse<Agreement>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: agreementKeys.list(params),
    queryFn: () => getAgreements(params),
    ...options,
  });
}

/**
 * Hook to fetch a single agreement by ID
 */
export function useAgreement(
  id: UUID,
  options?: Omit<UseQueryOptions<Agreement>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: agreementKeys.detail(id),
    queryFn: () => getAgreement(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook to fetch only active agreements
 */
export function useActiveAgreements(
  options?: Omit<UseQueryOptions<Agreement[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: agreementKeys.active(),
    queryFn: () => getActiveAgreements(),
    ...options,
  });
}

/**
 * Hook to fetch mandatory agreements
 */
export function useMandatoryAgreements(
  options?: Omit<UseQueryOptions<Agreement[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: agreementKeys.mandatory(),
    queryFn: () => getMandatoryAgreements(),
    ...options,
  });
}

// ==========================================
// AGREEMENT MUTATIONS (Admin)
// ==========================================

/**
 * Hook to create a new agreement
 */
export function useCreateAgreement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAgreementRequest) => createAgreement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agreementKeys.lists() });
      queryClient.invalidateQueries({ queryKey: agreementKeys.active() });
      queryClient.invalidateQueries({ queryKey: agreementKeys.mandatory() });
    },
  });
}

/**
 * Hook to update an agreement
 */
export function useUpdateAgreement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UpdateAgreementRequest }) =>
      updateAgreement(id, data),
    onSuccess: (updatedAgreement) => {
      queryClient.setQueryData(
        agreementKeys.detail(updatedAgreement.id),
        updatedAgreement
      );
      queryClient.invalidateQueries({ queryKey: agreementKeys.lists() });
      queryClient.invalidateQueries({ queryKey: agreementKeys.active() });
      queryClient.invalidateQueries({ queryKey: agreementKeys.mandatory() });
    },
  });
}

/**
 * Hook to delete an agreement
 */
export function useDeleteAgreement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => deleteAgreement(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: agreementKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: agreementKeys.lists() });
      queryClient.invalidateQueries({ queryKey: agreementKeys.active() });
      queryClient.invalidateQueries({ queryKey: agreementKeys.mandatory() });
    },
  });
}

/**
 * Hook to activate an agreement
 */
export function useActivateAgreement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => activateAgreement(id),
    onSuccess: (updatedAgreement) => {
      queryClient.setQueryData(
        agreementKeys.detail(updatedAgreement.id),
        updatedAgreement
      );
      queryClient.invalidateQueries({ queryKey: agreementKeys.lists() });
      queryClient.invalidateQueries({ queryKey: agreementKeys.active() });
      queryClient.invalidateQueries({ queryKey: agreementKeys.mandatory() });
    },
  });
}

/**
 * Hook to deactivate an agreement
 */
export function useDeactivateAgreement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => deactivateAgreement(id),
    onSuccess: (updatedAgreement) => {
      queryClient.setQueryData(
        agreementKeys.detail(updatedAgreement.id),
        updatedAgreement
      );
      queryClient.invalidateQueries({ queryKey: agreementKeys.lists() });
      queryClient.invalidateQueries({ queryKey: agreementKeys.active() });
      queryClient.invalidateQueries({ queryKey: agreementKeys.mandatory() });
    },
  });
}

// ==========================================
// MEMBER AGREEMENT QUERIES & MUTATIONS
// ==========================================

/**
 * Hook to fetch member's signed agreements
 */
export function useMemberAgreements(
  memberId: UUID,
  options?: Omit<UseQueryOptions<MemberAgreement[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: agreementKeys.member(memberId),
    queryFn: () => getMemberAgreements(memberId),
    enabled: !!memberId,
    ...options,
  });
}

/**
 * Hook to fetch member's agreement status (signed + pending)
 */
export function useMemberAgreementStatus(
  memberId: UUID,
  options?: Omit<UseQueryOptions<MemberAgreementStatus>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: agreementKeys.memberStatus(memberId),
    queryFn: () => getMemberAgreementStatus(memberId),
    enabled: !!memberId,
    ...options,
  });
}

/**
 * Hook to sign an agreement for a member
 */
export function useSignAgreement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      memberId,
      agreementId,
      data,
    }: {
      memberId: UUID;
      agreementId: UUID;
      data?: SignAgreementRequest;
    }) => signAgreement(memberId, agreementId, data),
    onSuccess: (_, { memberId }) => {
      queryClient.invalidateQueries({ queryKey: agreementKeys.member(memberId) });
      queryClient.invalidateQueries({
        queryKey: agreementKeys.memberStatus(memberId),
      });
    },
  });
}

// ==========================================
// MEMBER SELF-SERVICE HOOKS (api/me/agreements)
// ==========================================

export const myAgreementKeys = {
  all: ["my-agreements"] as const,
  list: () => [...myAgreementKeys.all, "list"] as const,
  status: () => [...myAgreementKeys.all, "status"] as const,
};

/**
 * Hook to fetch my signed agreements (self-service)
 */
export function useMyAgreements(
  options?: Omit<UseQueryOptions<MemberAgreement[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: myAgreementKeys.list(),
    queryFn: getMyAgreements,
    ...options,
  });
}

/**
 * Hook to fetch my agreement status (self-service)
 */
export function useMyAgreementStatus(
  options?: Omit<UseQueryOptions<MemberAgreementStatus>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: myAgreementKeys.status(),
    queryFn: getMyAgreementStatus,
    ...options,
  });
}

/**
 * Hook to sign an agreement (self-service)
 */
export function useSignMyAgreement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      agreementId,
      data,
    }: {
      agreementId: UUID;
      data?: SignAgreementRequest;
    }) => signMyAgreement(agreementId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myAgreementKeys.all });
    },
  });
}

/**
 * Hook to sign multiple agreements (self-service)
 */
export function useSignMyAgreementsBulk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      agreementIds,
      data,
    }: {
      agreementIds: UUID[];
      data?: SignAgreementRequest;
    }) => signMyAgreementsBulk(agreementIds, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myAgreementKeys.all });
    },
  });
}
