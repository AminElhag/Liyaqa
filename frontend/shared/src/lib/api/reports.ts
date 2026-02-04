import { api } from "./client";
import type { UUID, PaginatedResponse } from "../../types/api";
import type {
  RevenueReport,
  AttendanceReport,
  MemberReport,
  ReportQueryParams,
  ScheduledReport,
  ReportHistory,
  ChurnReport,
  LtvReport,
  CreateScheduledReportRequest,
  UpdateScheduledReportRequest,
  GenerateChurnReportRequest,
  GenerateLtvReportRequest,
  ScheduledReportQueryParams,
  ReportHistoryQueryParams,
} from "../../types/report";

const REPORTS_ENDPOINT = "api/reports";

/**
 * Build query string from params
 */
function buildQueryString(params: ReportQueryParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set("startDate", params.startDate);
  searchParams.set("endDate", params.endDate);
  if (params.groupBy) searchParams.set("groupBy", params.groupBy);
  return searchParams.toString();
}

/**
 * Get revenue report
 */
export async function getRevenueReport(
  params: ReportQueryParams
): Promise<RevenueReport> {
  const query = buildQueryString(params);
  return api.get(`${REPORTS_ENDPOINT}/revenue?${query}`).json();
}

/**
 * Get attendance report
 */
export async function getAttendanceReport(
  params: ReportQueryParams
): Promise<AttendanceReport> {
  const query = buildQueryString(params);
  return api.get(`${REPORTS_ENDPOINT}/attendance?${query}`).json();
}

/**
 * Get member report
 */
export async function getMemberReport(
  params: ReportQueryParams
): Promise<MemberReport> {
  const query = buildQueryString(params);
  return api.get(`${REPORTS_ENDPOINT}/members?${query}`).json();
}

// ========== Churn Report ==========

export async function generateChurnReport(
  data: GenerateChurnReportRequest
): Promise<ChurnReport> {
  return api.post(`${REPORTS_ENDPOINT}/churn`, { json: data }).json();
}

// ========== LTV Report ==========

export async function generateLtvReport(
  data: GenerateLtvReportRequest
): Promise<LtvReport> {
  return api.post(`${REPORTS_ENDPOINT}/ltv`, { json: data }).json();
}

// ========== Scheduled Reports ==========

function buildScheduledQueryString(
  params: ScheduledReportQueryParams | ReportHistoryQueryParams
): string {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if ("sortBy" in params && params.sortBy)
    searchParams.set("sortBy", params.sortBy);
  if ("sortDirection" in params && params.sortDirection)
    searchParams.set("sortDirection", params.sortDirection);
  return searchParams.toString();
}

export async function getScheduledReports(
  params: ScheduledReportQueryParams = {}
): Promise<PaginatedResponse<ScheduledReport>> {
  const query = buildScheduledQueryString(params);
  const url = query
    ? `${REPORTS_ENDPOINT}/scheduled?${query}`
    : `${REPORTS_ENDPOINT}/scheduled`;
  return api.get(url).json();
}

export async function getScheduledReport(id: UUID): Promise<ScheduledReport> {
  return api.get(`${REPORTS_ENDPOINT}/scheduled/${id}`).json();
}

export async function createScheduledReport(
  data: CreateScheduledReportRequest
): Promise<ScheduledReport> {
  return api.post(`${REPORTS_ENDPOINT}/scheduled`, { json: data }).json();
}

export async function updateScheduledReport(
  id: UUID,
  data: UpdateScheduledReportRequest
): Promise<ScheduledReport> {
  return api.put(`${REPORTS_ENDPOINT}/scheduled/${id}`, { json: data }).json();
}

export async function deleteScheduledReport(id: UUID): Promise<void> {
  await api.delete(`${REPORTS_ENDPOINT}/scheduled/${id}`);
}

export async function enableScheduledReport(id: UUID): Promise<ScheduledReport> {
  return api.post(`${REPORTS_ENDPOINT}/scheduled/${id}/enable`).json();
}

export async function disableScheduledReport(
  id: UUID
): Promise<ScheduledReport> {
  return api.post(`${REPORTS_ENDPOINT}/scheduled/${id}/disable`).json();
}

// ========== Report History ==========

export async function getReportHistory(
  params: ReportHistoryQueryParams = {}
): Promise<PaginatedResponse<ReportHistory>> {
  const query = buildScheduledQueryString(params);
  const url = query
    ? `${REPORTS_ENDPOINT}/history?${query}`
    : `${REPORTS_ENDPOINT}/history`;
  return api.get(url).json();
}

export async function getReportHistoryEntry(id: UUID): Promise<ReportHistory> {
  return api.get(`${REPORTS_ENDPOINT}/history/${id}`).json();
}
