import { api } from "../client";
import type {
  ComplianceContract,
  ZatcaOverview,
  ZatcaIssue,
  ZatcaMonthlyPoint,
  DataRequest,
} from "../../../types/platform/compliance";

const BASE_URL = "api/v1/platform/compliance";

// Paginated response shape from Spring Boot PageResponse
interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export async function getContracts(): Promise<ComplianceContract[]> {
  const res = await api.get(`${BASE_URL}/contracts?size=100`).json<PageResponse<ComplianceContract>>();
  return res.content;
}

export async function getZatcaOverview(): Promise<ZatcaOverview> {
  return api.get(`${BASE_URL}/zatca/status`).json<ZatcaOverview>();
}

export async function getZatcaIssues(limit = 20): Promise<ZatcaIssue[]> {
  return api.get(`${BASE_URL}/zatca/issues?limit=${limit}`).json<ZatcaIssue[]>();
}

export async function getZatcaMonthlyTrend(months = 6): Promise<ZatcaMonthlyPoint[]> {
  return api.get(`${BASE_URL}/zatca/trend?months=${months}`).json<ZatcaMonthlyPoint[]>();
}

export async function retryZatcaCompliance(invoiceId: string): Promise<void> {
  await api.post(`${BASE_URL}/zatca/retry/${invoiceId}`);
}

export async function getDataRequests(): Promise<DataRequest[]> {
  const res = await api.get(`${BASE_URL}/data-requests?size=100`).json<PageResponse<DataRequest>>();
  return res.content;
}

export async function processDataRequest(id: string, action: "approve" | "reject", reason?: string): Promise<DataRequest> {
  if (action === "reject") {
    return api.put(`${BASE_URL}/data-requests/${id}/reject`, { json: { reason: reason || "Rejected by platform admin" } }).json<DataRequest>();
  }
  return api.put(`${BASE_URL}/data-requests/${id}/approve`).json<DataRequest>();
}

export type {
  ComplianceContract, ZatcaOverview, ZatcaIssue, ZatcaMonthlyPoint, DataRequest,
};
