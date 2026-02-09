import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getClubAgreements,
  createClubAgreement,
  updateClubAgreement,
  deleteClubAgreement,
  activateClubAgreement,
  deactivateClubAgreement,
} from '@/api/endpoints/club-agreements'
import type { CreateAgreementRequest, UpdateAgreementRequest } from '@/types'

// Query key factory
export const clubAgreementKeys = {
  all: ['club-agreements'] as const,
  list: (clubId: string, filters: { page?: number; size?: number }) =>
    [...clubAgreementKeys.all, clubId, filters] as const,
}

/**
 * Fetch agreements for a club with pagination.
 */
export function useClubAgreements(
  clubId: string,
  params: { page?: number; size?: number } = {},
) {
  return useQuery({
    queryKey: clubAgreementKeys.list(clubId, params),
    queryFn: () => getClubAgreements(clubId, params),
    staleTime: 120_000,
    enabled: !!clubId,
  })
}

/**
 * Create a new agreement for a club.
 */
export function useCreateClubAgreement(clubId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateAgreementRequest) =>
      createClubAgreement(clubId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...clubAgreementKeys.all, clubId],
      })
    },
  })
}

/**
 * Update an existing agreement.
 */
export function useUpdateClubAgreement(clubId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      agreementId,
      data,
    }: {
      agreementId: string
      data: UpdateAgreementRequest
    }) => updateClubAgreement(clubId, agreementId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...clubAgreementKeys.all, clubId],
      })
    },
  })
}

/**
 * Delete an agreement.
 */
export function useDeleteClubAgreement(clubId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (agreementId: string) =>
      deleteClubAgreement(clubId, agreementId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...clubAgreementKeys.all, clubId],
      })
    },
  })
}

/**
 * Activate an agreement.
 */
export function useActivateClubAgreement(clubId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (agreementId: string) =>
      activateClubAgreement(clubId, agreementId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...clubAgreementKeys.all, clubId],
      })
    },
  })
}

/**
 * Deactivate an agreement.
 */
export function useDeactivateClubAgreement(clubId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (agreementId: string) =>
      deactivateClubAgreement(clubId, agreementId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...clubAgreementKeys.all, clubId],
      })
    },
  })
}
