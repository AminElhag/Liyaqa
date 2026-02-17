import { api } from "../client";
import type {
  RevenueMetricsResponse,
  PlanRevenueResponse,
  OutstandingInvoiceResponse,
  MarkPaidRequest,
} from "../../../types/platform/billing";

const BASE_URL = "api/v1/platform/billing";

/**
 * Get revenue metrics (MRR, ARR, growth)
 */
export async function getRevenueMetrics(): Promise<RevenueMetricsResponse> {
  return api.get(`${BASE_URL}/revenue`).json<RevenueMetricsResponse>();
}

/**
 * Get revenue breakdown by plan
 */
export async function getRevenueByPlan(): Promise<PlanRevenueResponse[]> {
  return api.get(`${BASE_URL}/revenue/by-plan`).json<PlanRevenueResponse[]>();
}

/**
 * Get outstanding invoices
 */
export async function getOutstandingInvoices(): Promise<OutstandingInvoiceResponse[]> {
  return api.get(`${BASE_URL}/invoices/outstanding`).json<OutstandingInvoiceResponse[]>();
}

/**
 * Mark an invoice as paid
 */
export async function markInvoicePaid(
  invoiceId: string,
  data?: MarkPaidRequest
): Promise<void> {
  await api.post(`${BASE_URL}/invoices/${invoiceId}/mark-paid`, {
    json: data || {},
  });
}
