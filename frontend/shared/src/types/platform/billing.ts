import type { UUID } from "../api";

/**
 * Revenue metrics response
 */
export interface RevenueMetricsResponse {
  mrr: number;
  arr: number;
  mrrGrowthPercent: number;
  totalRevenue: number;
  averageRevenuePerClient: number;
  currency: string;
}

/**
 * Revenue by plan breakdown
 */
export interface PlanRevenueResponse {
  planId: UUID;
  planNameEn: string;
  planNameAr?: string;
  activeSubscriptions: number;
  monthlyRevenue: number;
  percentOfTotal: number;
  currency: string;
}

/**
 * Outstanding invoice
 */
export interface OutstandingInvoiceResponse {
  invoiceId: UUID;
  invoiceNumber: string;
  tenantId: UUID;
  tenantNameEn: string;
  tenantNameAr?: string;
  amount: number;
  currency: string;
  dueDate: string;
  daysOverdue: number;
  status: "PENDING" | "OVERDUE" | "PARTIALLY_PAID";
}

/**
 * Mark invoice as paid request
 */
export interface MarkPaidRequest {
  paymentMethod?: string;
  paymentReference?: string;
  paidAt?: string;
  notes?: string;
}
