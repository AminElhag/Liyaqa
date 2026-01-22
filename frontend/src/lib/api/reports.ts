import { api } from "./client";
import type {
  RevenueReport,
  AttendanceReport,
  MemberReport,
  ReportQueryParams,
} from "@/types/report";

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
