import api from '@/api/client'
import type {
  PageResponse,
  Agreement,
  CreateAgreementRequest,
  UpdateAgreementRequest,
} from '@/types'

const BASE_URL = 'api/platform/clubs'

/**
 * Get agreements for a club with pagination.
 */
export async function getClubAgreements(
  clubId: string,
  params: { page?: number; size?: number } = {},
): Promise<PageResponse<Agreement>> {
  const queryParams: Record<string, string | number> = {}
  if (params.page !== undefined) queryParams.page = params.page
  if (params.size !== undefined) queryParams.size = params.size

  return api
    .get<PageResponse<Agreement>>(`${BASE_URL}/${clubId}/agreements`, {
      params: queryParams,
    })
    .then((r) => r.data)
}

/**
 * Create a new agreement for a club.
 */
export async function createClubAgreement(
  clubId: string,
  data: CreateAgreementRequest,
): Promise<Agreement> {
  return api
    .post<Agreement>(`${BASE_URL}/${clubId}/agreements`, data)
    .then((r) => r.data)
}

/**
 * Update an existing agreement.
 */
export async function updateClubAgreement(
  clubId: string,
  agreementId: string,
  data: UpdateAgreementRequest,
): Promise<Agreement> {
  return api
    .put<Agreement>(`${BASE_URL}/${clubId}/agreements/${agreementId}`, data)
    .then((r) => r.data)
}

/**
 * Delete an agreement.
 */
export async function deleteClubAgreement(
  clubId: string,
  agreementId: string,
): Promise<void> {
  return api
    .delete(`${BASE_URL}/${clubId}/agreements/${agreementId}`)
    .then(() => undefined)
}

/**
 * Activate an agreement.
 */
export async function activateClubAgreement(
  clubId: string,
  agreementId: string,
): Promise<Agreement> {
  return api
    .post<Agreement>(
      `${BASE_URL}/${clubId}/agreements/${agreementId}/activate`,
    )
    .then((r) => r.data)
}

/**
 * Deactivate an agreement.
 */
export async function deactivateClubAgreement(
  clubId: string,
  agreementId: string,
): Promise<Agreement> {
  return api
    .post<Agreement>(
      `${BASE_URL}/${clubId}/agreements/${agreementId}/deactivate`,
    )
    .then((r) => r.data)
}
