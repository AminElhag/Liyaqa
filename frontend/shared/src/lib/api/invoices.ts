import { api } from "./client";
import type { PaginatedResponse, UUID } from "../../types/api";
import type {
  Invoice,
  InvoiceQueryParams,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  PayInvoiceRequest,
  Payment,
  CatalogItem,
  InvoiceSummary,
} from "../../types/billing";
import type { BulkOperationResult } from "../../types/attendance";

/**
 * Get paginated invoices
 */
export async function getInvoices(
  params: InvoiceQueryParams = {}
): Promise<PaginatedResponse<Invoice>> {
  const searchParams = new URLSearchParams();

  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.memberId) searchParams.set("memberId", params.memberId);
  if (params.status) searchParams.set("status", params.status);
  if (params.search) searchParams.set("search", params.search);
  if (params.dateFrom) searchParams.set("dateFrom", params.dateFrom);
  if (params.dateTo) searchParams.set("dateTo", params.dateTo);
  if (params.sort) searchParams.set("sortBy", params.sort);
  if (params.direction) searchParams.set("sortDirection", params.direction);

  const queryString = searchParams.toString();
  const url = queryString ? `api/invoices?${queryString}` : "api/invoices";

  return api.get(url).json();
}

/**
 * Get a single invoice by ID
 */
export async function getInvoice(id: UUID): Promise<Invoice> {
  return api.get(`api/invoices/${id}`).json();
}

/**
 * Create a new invoice
 */
export async function createInvoice(
  data: CreateInvoiceRequest
): Promise<Invoice> {
  return api.post("api/invoices", { json: data }).json();
}

/**
 * Update an invoice
 */
export async function updateInvoice(
  id: UUID,
  data: UpdateInvoiceRequest
): Promise<Invoice> {
  return api.put(`api/invoices/${id}`, { json: data }).json();
}

/**
 * Delete an invoice
 */
export async function deleteInvoice(id: UUID): Promise<void> {
  await api.delete(`api/invoices/${id}`);
}

/**
 * Issue an invoice (change status to ISSUED)
 */
export async function issueInvoice(id: UUID): Promise<Invoice> {
  return api.post(`api/invoices/${id}/issue`).json();
}

/**
 * Cancel an invoice
 */
export async function cancelInvoice(id: UUID): Promise<Invoice> {
  return api.post(`api/invoices/${id}/cancel`).json();
}

/**
 * Record a payment on an invoice
 */
export async function payInvoice(
  id: UUID,
  data: PayInvoiceRequest
): Promise<Invoice> {
  return api.post(`api/invoices/${id}/pay`, { json: data }).json();
}

/**
 * Download invoice PDF
 */
export async function downloadInvoicePdf(id: UUID): Promise<Blob> {
  return api.get(`api/invoices/${id}/pdf`).blob();
}

/**
 * Get member's invoices
 */
export async function getMemberInvoices(
  memberId: UUID,
  params: Omit<InvoiceQueryParams, "memberId"> = {}
): Promise<PaginatedResponse<Invoice>> {
  return getInvoices({ ...params, memberId });
}

/**
 * Bulk issue invoices
 */
export async function bulkIssueInvoices(
  ids: UUID[]
): Promise<BulkOperationResult> {
  return api.post("api/invoices/bulk/status", {
    json: { invoiceIds: ids, action: "ISSUE" },
  }).json();
}

/**
 * Bulk cancel invoices
 */
export async function bulkCancelInvoices(
  ids: UUID[]
): Promise<BulkOperationResult> {
  return api.post("api/invoices/bulk/status", {
    json: { invoiceIds: ids, action: "CANCEL" },
  }).json();
}

/**
 * Create invoice from subscription
 */
export async function createInvoiceFromSubscription(
  subscriptionId: UUID
): Promise<Invoice> {
  return api.post(`api/subscriptions/${subscriptionId}/invoice`).json();
}

/**
 * Get payments for an invoice
 */
export async function getInvoicePayments(
  invoiceId: UUID
): Promise<Payment[]> {
  return api.get(`api/invoices/${invoiceId}/payments`).json();
}

/**
 * Get catalog items for line item picker
 */
export async function getInvoiceCatalog(): Promise<CatalogItem[]> {
  return api.get("api/invoices/catalog").json();
}

/**
 * Get invoice summary stats
 */
export async function getInvoiceSummary(): Promise<InvoiceSummary> {
  return api.get("api/invoices/summary").json();
}
