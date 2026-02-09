import api from '@/api/client'
import type {
  DunningSequence,
  DunningStatistics,
  DunningFilters,
  DunningSequenceStatus,
} from '@/types'

const BASE_URL = 'api/platform/dunning'

/**
 * Paginated dunning response.
 */
export interface PaginatedDunning {
  content: DunningSequence[]
  totalElements: number
  totalPages: number
  page: number
  pageSize: number
}

/**
 * Get active dunning sequences.
 */
export async function getActiveDunning(
  limit: number = 50,
): Promise<DunningSequence[]> {
  return api
    .get<DunningSequence[]>(`${BASE_URL}/active`, { params: { limit } })
    .then((r) => r.data)
}

/**
 * Get dunning sequences with filters.
 */
export async function getDunningSequences(
  filters?: DunningFilters,
): Promise<PaginatedDunning> {
  const params: Record<string, string | number> = {}

  if (filters?.status?.length) {
    params.status = filters.status.join(',')
  }
  if (filters?.organizationId) {
    params.organizationId = filters.organizationId
  }
  if (filters?.minAmount !== undefined) {
    params.minAmount = filters.minAmount
  }
  if (filters?.maxAmount !== undefined) {
    params.maxAmount = filters.maxAmount
  }
  if (filters?.startDate) {
    params.startDate = filters.startDate
  }
  if (filters?.endDate) {
    params.endDate = filters.endDate
  }
  if (filters?.page !== undefined) {
    params.page = filters.page
  }
  if (filters?.pageSize !== undefined) {
    params.pageSize = filters.pageSize
  }

  return api.get<PaginatedDunning>(BASE_URL, { params }).then((r) => r.data)
}

/**
 * Get dunning statistics.
 */
export async function getDunningStatistics(): Promise<DunningStatistics> {
  return api.get<DunningStatistics>(`${BASE_URL}/statistics`).then((r) => r.data)
}

/**
 * Get dunning sequence detail.
 */
export async function getDunningDetail(dunningId: string): Promise<DunningSequence> {
  return api.get<DunningSequence>(`${BASE_URL}/${dunningId}`).then((r) => r.data)
}

/**
 * Get dunning sequences for organization.
 */
export async function getOrganizationDunning(
  organizationId: string,
): Promise<DunningSequence[]> {
  return api
    .get<DunningSequence[]>(`${BASE_URL}/organization/${organizationId}`)
    .then((r) => r.data)
}

/**
 * Retry payment manually.
 */
export async function retryPayment(
  dunningId: string,
): Promise<{ success: boolean; message: string; sequence: DunningSequence }> {
  return api
    .post<{ success: boolean; message: string; sequence: DunningSequence }>(
      `${BASE_URL}/${dunningId}/retry`,
    )
    .then((r) => r.data)
}

/**
 * Send payment link to client.
 */
export async function sendPaymentLink(
  dunningId: string,
): Promise<{ success: boolean; message: string }> {
  return api
    .post<{ success: boolean; message: string }>(
      `${BASE_URL}/${dunningId}/send-payment-link`,
    )
    .then((r) => r.data)
}

/**
 * Escalate to CSM.
 */
export async function escalateToCsm(
  dunningId: string,
  csmId?: string,
  notes?: string,
): Promise<DunningSequence> {
  return api
    .post<DunningSequence>(`${BASE_URL}/${dunningId}/escalate`, { csmId, notes })
    .then((r) => r.data)
}

/**
 * Pause dunning sequence.
 */
export async function pauseDunning(
  dunningId: string,
  reason?: string,
): Promise<DunningSequence> {
  return api
    .post<DunningSequence>(
      `${BASE_URL}/${dunningId}/pause`,
      reason ? { reason } : undefined,
    )
    .then((r) => r.data)
}

/**
 * Resume dunning sequence.
 */
export async function resumeDunning(dunningId: string): Promise<DunningSequence> {
  return api
    .post<DunningSequence>(`${BASE_URL}/${dunningId}/resume`)
    .then((r) => r.data)
}

/**
 * Cancel dunning sequence.
 */
export async function cancelDunning(
  dunningId: string,
  reason?: string,
): Promise<DunningSequence> {
  return api
    .post<DunningSequence>(
      `${BASE_URL}/${dunningId}/cancel`,
      reason ? { reason } : undefined,
    )
    .then((r) => r.data)
}

/**
 * Mark dunning as recovered manually.
 */
export async function markAsRecovered(
  dunningId: string,
  notes?: string,
): Promise<DunningSequence> {
  return api
    .post<DunningSequence>(
      `${BASE_URL}/${dunningId}/mark-recovered`,
      notes ? { notes } : undefined,
    )
    .then((r) => r.data)
}

/**
 * Add note to dunning sequence.
 */
export async function addDunningNote(
  dunningId: string,
  note: string,
): Promise<DunningSequence> {
  return api
    .post<DunningSequence>(`${BASE_URL}/${dunningId}/add-note`, { note })
    .then((r) => r.data)
}

/**
 * Get dunning sequences by status.
 */
export async function getDunningByStatus(
  status: DunningSequenceStatus,
  limit: number = 50,
): Promise<DunningSequence[]> {
  return api
    .get<DunningSequence[]>(`${BASE_URL}/by-status/${status}`, {
      params: { limit },
    })
    .then((r) => r.data)
}

/**
 * Export dunning report to CSV.
 */
export async function exportDunningToCsv(filters?: DunningFilters): Promise<Blob> {
  const params: Record<string, string> = {}

  if (filters?.status?.length) {
    params.status = filters.status.join(',')
  }
  if (filters?.startDate) {
    params.startDate = filters.startDate
  }
  if (filters?.endDate) {
    params.endDate = filters.endDate
  }

  return api
    .get<Blob>(`${BASE_URL}/export/csv`, { params, responseType: 'blob' })
    .then((r) => r.data)
}

/**
 * Get revenue at risk summary.
 */
export async function getRevenueAtRisk(): Promise<{
  total: number
  byDay: { day: number; amount: number }[]
  currency: string
}> {
  return api
    .get<{ total: number; byDay: { day: number; amount: number }[]; currency: string }>(
      `${BASE_URL}/revenue-at-risk`,
    )
    .then((r) => r.data)
}
