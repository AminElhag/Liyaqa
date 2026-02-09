import api from '@/api/client'
import type {
  PageResponse,
  Deal,
  DealSummary,
  DealStats,
  SalesRepDealStats,
  DealConversionResult,
  CreateDealRequest,
  UpdateDealRequest,
  ConvertDealRequest,
  LoseDealRequest,
  ReassignDealRequest,
  DealQueryParams,
  DealStatus,
  DealSource,
} from '@/types'

const BASE_URL = 'api/platform/deals'

/**
 * Create a new deal.
 */
export async function createDeal(data: CreateDealRequest): Promise<Deal> {
  return api.post<Deal>(BASE_URL, data).then((r) => r.data)
}

/**
 * Get deal by ID.
 */
export async function getDeal(id: string): Promise<Deal> {
  return api.get<Deal>(`${BASE_URL}/${id}`).then((r) => r.data)
}

/**
 * Get all deals with pagination and filters.
 */
export async function getDeals(
  queryParams: DealQueryParams = {},
): Promise<PageResponse<DealSummary>> {
  const params: Record<string, string | number> = {}
  if (queryParams.page !== undefined) params.page = queryParams.page
  if (queryParams.size !== undefined) params.size = queryParams.size
  if (queryParams.sortBy) params.sortBy = queryParams.sortBy
  if (queryParams.sortDirection) params.sortDirection = queryParams.sortDirection
  if (queryParams.status) params.status = queryParams.status
  if (queryParams.source) params.source = queryParams.source
  if (queryParams.salesRepId) params.salesRepId = queryParams.salesRepId
  if (queryParams.search) params.search = queryParams.search

  return api.get<PageResponse<DealSummary>>(BASE_URL, { params }).then((r) => r.data)
}

/**
 * Get deals by status.
 */
export async function getDealsByStatus(
  status: DealStatus,
  queryParams: DealQueryParams = {},
): Promise<PageResponse<DealSummary>> {
  const params: Record<string, string | number> = {}
  if (queryParams.page !== undefined) params.page = queryParams.page
  if (queryParams.size !== undefined) params.size = queryParams.size

  return api
    .get<PageResponse<DealSummary>>(`${BASE_URL}/status/${status}`, { params })
    .then((r) => r.data)
}

/**
 * Get deals by source.
 */
export async function getDealsBySource(
  source: DealSource,
  queryParams: DealQueryParams = {},
): Promise<PageResponse<DealSummary>> {
  const params: Record<string, string | number> = {}
  if (queryParams.page !== undefined) params.page = queryParams.page
  if (queryParams.size !== undefined) params.size = queryParams.size

  return api
    .get<PageResponse<DealSummary>>(`${BASE_URL}/source/${source}`, { params })
    .then((r) => r.data)
}

/**
 * Get open deals.
 */
export async function getOpenDeals(
  queryParams: DealQueryParams = {},
): Promise<PageResponse<DealSummary>> {
  const params: Record<string, string | number> = {}
  if (queryParams.page !== undefined) params.page = queryParams.page
  if (queryParams.size !== undefined) params.size = queryParams.size

  return api
    .get<PageResponse<DealSummary>>(`${BASE_URL}/open`, { params })
    .then((r) => r.data)
}

/**
 * Get expiring deals (by expected close date).
 */
export async function getExpiringDeals(daysAhead: number = 30): Promise<DealSummary[]> {
  return api
    .get<DealSummary[]>(`${BASE_URL}/expiring`, { params: { daysAhead } })
    .then((r) => r.data)
}

/**
 * Get current user's deals.
 */
export async function getMyDeals(
  queryParams: DealQueryParams = {},
): Promise<PageResponse<DealSummary>> {
  const params: Record<string, string | number> = {}
  if (queryParams.page !== undefined) params.page = queryParams.page
  if (queryParams.size !== undefined) params.size = queryParams.size
  if (queryParams.status) params.status = queryParams.status

  return api
    .get<PageResponse<DealSummary>>('api/platform/my-deals', { params })
    .then((r) => r.data)
}

/**
 * Get deals by sales rep.
 */
export async function getDealsBySalesRep(
  salesRepId: string,
  queryParams: DealQueryParams = {},
): Promise<PageResponse<DealSummary>> {
  const params: Record<string, string | number> = {}
  if (queryParams.page !== undefined) params.page = queryParams.page
  if (queryParams.size !== undefined) params.size = queryParams.size

  return api
    .get<PageResponse<DealSummary>>(`${BASE_URL}/sales-rep/${salesRepId}`, { params })
    .then((r) => r.data)
}

/**
 * Update a deal.
 */
export async function updateDeal(id: string, data: UpdateDealRequest): Promise<Deal> {
  return api.put<Deal>(`${BASE_URL}/${id}`, data).then((r) => r.data)
}

/**
 * Delete a deal.
 */
export async function deleteDeal(id: string): Promise<void> {
  await api.delete(`${BASE_URL}/${id}`)
}

/**
 * Advance deal to next stage.
 */
export async function advanceDeal(id: string): Promise<Deal> {
  return api.post<Deal>(`${BASE_URL}/${id}/advance`).then((r) => r.data)
}

/**
 * Qualify a deal (LEAD -> QUALIFIED).
 */
export async function qualifyDeal(id: string): Promise<Deal> {
  return api.post<Deal>(`${BASE_URL}/${id}/qualify`).then((r) => r.data)
}

/**
 * Send proposal (QUALIFIED -> PROPOSAL).
 */
export async function sendProposal(id: string): Promise<Deal> {
  return api.post<Deal>(`${BASE_URL}/${id}/proposal`).then((r) => r.data)
}

/**
 * Start negotiation (PROPOSAL -> NEGOTIATION).
 */
export async function startNegotiation(id: string): Promise<Deal> {
  return api.post<Deal>(`${BASE_URL}/${id}/negotiate`).then((r) => r.data)
}

/**
 * Convert deal to client (win the deal).
 */
export async function convertDeal(
  id: string,
  data: ConvertDealRequest,
): Promise<DealConversionResult> {
  return api
    .post<DealConversionResult>(`${BASE_URL}/${id}/convert`, data)
    .then((r) => r.data)
}

/**
 * Mark deal as lost.
 */
export async function loseDeal(id: string, data: LoseDealRequest): Promise<Deal> {
  return api.post<Deal>(`${BASE_URL}/${id}/lose`, data).then((r) => r.data)
}

/**
 * Reopen a lost deal.
 */
export async function reopenDeal(id: string): Promise<Deal> {
  return api.post<Deal>(`${BASE_URL}/${id}/reopen`).then((r) => r.data)
}

/**
 * Reassign deal to another sales rep.
 */
export async function reassignDeal(id: string, data: ReassignDealRequest): Promise<Deal> {
  return api.post<Deal>(`${BASE_URL}/${id}/reassign`, data).then((r) => r.data)
}

/**
 * Get deal pipeline statistics.
 */
export async function getDealStats(): Promise<DealStats> {
  return api.get<DealStats>(`${BASE_URL}/stats`).then((r) => r.data)
}

/**
 * Get current user's deal statistics.
 */
export async function getMyDealStats(): Promise<SalesRepDealStats> {
  return api.get<SalesRepDealStats>('api/platform/my-deals/stats').then((r) => r.data)
}

/**
 * Get sales rep's deal statistics.
 */
export async function getSalesRepDealStats(salesRepId: string): Promise<SalesRepDealStats> {
  return api
    .get<SalesRepDealStats>(`${BASE_URL}/sales-rep/${salesRepId}/stats`)
    .then((r) => r.data)
}
