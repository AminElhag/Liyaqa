"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getClubAgreements,
  getClubAgreement,
  createClubAgreement,
  updateClubAgreement,
  activateClubAgreement,
  deactivateClubAgreement,
  deleteClubAgreement,
} from "@/lib/api/platform/club-agreements";
import type { PaginatedResponse, UUID } from "@/types/api";
import type {
  Agreement,
  CreateAgreementRequest,
  UpdateAgreementRequest,
} from "@/types/agreement";

// Query keys for platform club agreements
export const clubAgreementKeys = {
  all: ["platform-club-agreements"] as const,
  lists: () => [...clubAgreementKeys.all, "list"] as const,
  list: (clubId: UUID, params?: { page?: number; size?: number }) =>
    [...clubAgreementKeys.lists(), clubId, params] as const,
  details: () => [...clubAgreementKeys.all, "detail"] as const,
  detail: (clubId: UUID, agreementId: UUID) =>
    [...clubAgreementKeys.details(), clubId, agreementId] as const,
};

// ==========================================
// QUERIES
// ==========================================

/**
 * Hook to fetch paginated agreements for a club
 */
export function useClubAgreements(
  clubId: UUID,
  params: { page?: number; size?: number } = {},
  options?: Omit<
    UseQueryOptions<PaginatedResponse<Agreement>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: clubAgreementKeys.list(clubId, params),
    queryFn: () => getClubAgreements(clubId, params),
    enabled: !!clubId,
    ...options,
  });
}

/**
 * Hook to fetch a single agreement for a club
 */
export function useClubAgreement(
  clubId: UUID,
  agreementId: UUID,
  options?: Omit<UseQueryOptions<Agreement>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: clubAgreementKeys.detail(clubId, agreementId),
    queryFn: () => getClubAgreement(clubId, agreementId),
    enabled: !!clubId && !!agreementId,
    ...options,
  });
}

// ==========================================
// MUTATIONS
// ==========================================

/**
 * Hook to create a new agreement for a club
 */
export function useCreateClubAgreement(clubId: UUID) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAgreementRequest) =>
      createClubAgreement(clubId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clubAgreementKeys.lists() });
    },
  });
}

/**
 * Hook to update an agreement for a club
 */
export function useUpdateClubAgreement(clubId: UUID) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      agreementId,
      data,
    }: {
      agreementId: UUID;
      data: UpdateAgreementRequest;
    }) => updateClubAgreement(clubId, agreementId, data),
    onSuccess: (updatedAgreement) => {
      queryClient.setQueryData(
        clubAgreementKeys.detail(clubId, updatedAgreement.id),
        updatedAgreement
      );
      queryClient.invalidateQueries({ queryKey: clubAgreementKeys.lists() });
    },
  });
}

/**
 * Hook to activate an agreement for a club
 */
export function useActivateClubAgreement(clubId: UUID) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (agreementId: UUID) => activateClubAgreement(clubId, agreementId),
    onSuccess: (updatedAgreement) => {
      queryClient.setQueryData(
        clubAgreementKeys.detail(clubId, updatedAgreement.id),
        updatedAgreement
      );
      queryClient.invalidateQueries({ queryKey: clubAgreementKeys.lists() });
    },
  });
}

/**
 * Hook to deactivate an agreement for a club
 */
export function useDeactivateClubAgreement(clubId: UUID) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (agreementId: UUID) => deactivateClubAgreement(clubId, agreementId),
    onSuccess: (updatedAgreement) => {
      queryClient.setQueryData(
        clubAgreementKeys.detail(clubId, updatedAgreement.id),
        updatedAgreement
      );
      queryClient.invalidateQueries({ queryKey: clubAgreementKeys.lists() });
    },
  });
}

/**
 * Hook to delete an agreement for a club
 */
export function useDeleteClubAgreement(clubId: UUID) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (agreementId: UUID) => deleteClubAgreement(clubId, agreementId),
    onSuccess: (_, agreementId) => {
      queryClient.removeQueries({
        queryKey: clubAgreementKeys.detail(clubId, agreementId),
      });
      queryClient.invalidateQueries({ queryKey: clubAgreementKeys.lists() });
    },
  });
}
