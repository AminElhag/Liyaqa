import { api } from "../client";
import type { PageResponse } from "@/types/api";
import type {
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
} from "@/types/platform";

const BASE_URL = "api/platform/deals";

/**
 * Create a new deal
 */
export async function createDeal(data: CreateDealRequest): Promise<Deal> {
  return api.post(BASE_URL, { json: data }).json<Deal>();
}

/**
 * Get deal by ID
 */
export async function getDeal(id: string): Promise<Deal> {
  return api.get(`${BASE_URL}/${id}`).json<Deal>();
}

/**
 * Get all deals with pagination and filters
 */
export async function getDeals(
  params: DealQueryParams = {}
): Promise<PageResponse<DealSummary>> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortDirection) searchParams.set("sortDirection", params.sortDirection);
  if (params.status) searchParams.set("status", params.status);
  if (params.source) searchParams.set("source", params.source);
  if (params.salesRepId) searchParams.set("salesRepId", params.salesRepId);
  if (params.search) searchParams.set("search", params.search);

  return api
    .get(BASE_URL, { searchParams })
    .json<PageResponse<DealSummary>>();
}

/**
 * Get deals by status
 */
export async function getDealsByStatus(
  status: DealStatus,
  params: DealQueryParams = {}
): Promise<PageResponse<DealSummary>> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  return api
    .get(`${BASE_URL}/status/${status}`, { searchParams })
    .json<PageResponse<DealSummary>>();
}

/**
 * Get deals by source
 */
export async function getDealsBySource(
  source: DealSource,
  params: DealQueryParams = {}
): Promise<PageResponse<DealSummary>> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  return api
    .get(`${BASE_URL}/source/${source}`, { searchParams })
    .json<PageResponse<DealSummary>>();
}

/**
 * Get open deals
 */
export async function getOpenDeals(
  params: DealQueryParams = {}
): Promise<PageResponse<DealSummary>> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  return api
    .get(`${BASE_URL}/open`, { searchParams })
    .json<PageResponse<DealSummary>>();
}

/**
 * Get expiring deals (by expected close date)
 */
export async function getExpiringDeals(daysAhead: number = 30): Promise<DealSummary[]> {
  return api
    .get(`${BASE_URL}/expiring`, { searchParams: { daysAhead: String(daysAhead) } })
    .json<DealSummary[]>();
}

/**
 * Get current user's deals
 */
export async function getMyDeals(
  params: DealQueryParams = {}
): Promise<PageResponse<DealSummary>> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.status) searchParams.set("status", params.status);

  return api
    .get(`${BASE_URL.replace("/deals", "")}/my-deals`, { searchParams })
    .json<PageResponse<DealSummary>>();
}

/**
 * Get deals by sales rep
 */
export async function getDealsBySalesRep(
  salesRepId: string,
  params: DealQueryParams = {}
): Promise<PageResponse<DealSummary>> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  return api
    .get(`${BASE_URL}/sales-rep/${salesRepId}`, { searchParams })
    .json<PageResponse<DealSummary>>();
}

/**
 * Update a deal
 */
export async function updateDeal(id: string, data: UpdateDealRequest): Promise<Deal> {
  return api.put(`${BASE_URL}/${id}`, { json: data }).json<Deal>();
}

/**
 * Delete a deal
 */
export async function deleteDeal(id: string): Promise<void> {
  await api.delete(`${BASE_URL}/${id}`);
}

/**
 * Advance deal to next stage
 */
export async function advanceDeal(id: string): Promise<Deal> {
  return api.post(`${BASE_URL}/${id}/advance`).json<Deal>();
}

/**
 * Qualify a deal (LEAD -> QUALIFIED)
 */
export async function qualifyDeal(id: string): Promise<Deal> {
  return api.post(`${BASE_URL}/${id}/qualify`).json<Deal>();
}

/**
 * Send proposal (QUALIFIED -> PROPOSAL)
 */
export async function sendProposal(id: string): Promise<Deal> {
  return api.post(`${BASE_URL}/${id}/proposal`).json<Deal>();
}

/**
 * Start negotiation (PROPOSAL -> NEGOTIATION)
 */
export async function startNegotiation(id: string): Promise<Deal> {
  return api.post(`${BASE_URL}/${id}/negotiate`).json<Deal>();
}

/**
 * Convert deal to client (win the deal)
 */
export async function convertDeal(
  id: string,
  data: ConvertDealRequest
): Promise<DealConversionResult> {
  return api.post(`${BASE_URL}/${id}/convert`, { json: data }).json<DealConversionResult>();
}

/**
 * Mark deal as lost
 */
export async function loseDeal(id: string, data: LoseDealRequest): Promise<Deal> {
  return api.post(`${BASE_URL}/${id}/lose`, { json: data }).json<Deal>();
}

/**
 * Reopen a lost deal
 */
export async function reopenDeal(id: string): Promise<Deal> {
  return api.post(`${BASE_URL}/${id}/reopen`).json<Deal>();
}

/**
 * Reassign deal to another sales rep
 */
export async function reassignDeal(id: string, data: ReassignDealRequest): Promise<Deal> {
  return api.post(`${BASE_URL}/${id}/reassign`, { json: data }).json<Deal>();
}

/**
 * Get deal pipeline statistics
 */
export async function getDealStats(): Promise<DealStats> {
  return api.get(`${BASE_URL}/stats`).json<DealStats>();
}

/**
 * Get current user's deal statistics
 */
export async function getMyDealStats(): Promise<SalesRepDealStats> {
  return api.get(`${BASE_URL.replace("/deals", "")}/my-deals/stats`).json<SalesRepDealStats>();
}

/**
 * Get sales rep's deal statistics
 */
export async function getSalesRepDealStats(salesRepId: string): Promise<SalesRepDealStats> {
  return api.get(`${BASE_URL}/sales-rep/${salesRepId}/stats`).json<SalesRepDealStats>();
}
