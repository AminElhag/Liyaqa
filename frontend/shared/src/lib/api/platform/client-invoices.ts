import { api } from "../client";
import type { PageResponse } from "../types/api";
import type {
  ClientInvoice,
  ClientInvoiceSummary,
  ClientInvoiceStats,
  CreateClientInvoiceRequest,
  GenerateFromSubscriptionRequest,
  IssueClientInvoiceRequest,
  RecordClientPaymentRequest,
  UpdateClientInvoiceRequest,
  ClientInvoiceQueryParams,
} from "../types/platform";

const BASE_URL = "api/platform/invoices";

/**
 * Create a new client invoice with line items
 */
export async function createClientInvoice(
  data: CreateClientInvoiceRequest
): Promise<ClientInvoice> {
  return api.post(BASE_URL, { json: data }).json<ClientInvoice>();
}

/**
 * Generate invoice from subscription
 */
export async function generateFromSubscription(
  data: GenerateFromSubscriptionRequest
): Promise<ClientInvoice> {
  return api
    .post(`${BASE_URL}/from-subscription`, { json: data })
    .json<ClientInvoice>();
}

/**
 * Get client invoice by ID
 */
export async function getClientInvoice(id: string): Promise<ClientInvoice> {
  return api.get(`${BASE_URL}/${id}`).json<ClientInvoice>();
}

/**
 * Get all client invoices with pagination
 */
export async function getClientInvoices(
  params: ClientInvoiceQueryParams = {}
): Promise<PageResponse<ClientInvoiceSummary>> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortDirection) searchParams.set("sortDirection", params.sortDirection);
  if (params.status) searchParams.set("status", params.status);
  if (params.organizationId) searchParams.set("organizationId", params.organizationId);

  return api.get(BASE_URL, { searchParams }).json<PageResponse<ClientInvoiceSummary>>();
}

/**
 * Get invoices by organization
 */
export async function getInvoicesByOrganization(
  organizationId: string,
  params: ClientInvoiceQueryParams = {}
): Promise<PageResponse<ClientInvoiceSummary>> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  return api
    .get(`${BASE_URL}/organization/${organizationId}`, { searchParams })
    .json<PageResponse<ClientInvoiceSummary>>();
}

/**
 * Update a client invoice
 */
export async function updateClientInvoice(
  id: string,
  data: UpdateClientInvoiceRequest
): Promise<ClientInvoice> {
  return api.put(`${BASE_URL}/${id}`, { json: data }).json<ClientInvoice>();
}

/**
 * Issue a client invoice
 */
export async function issueClientInvoice(
  id: string,
  data: IssueClientInvoiceRequest = {}
): Promise<ClientInvoice> {
  // Provide default values for Kotlin backend compatibility
  const requestBody = {
    issueDate: data.issueDate || new Date().toISOString().split('T')[0],
    paymentDueDays: data.paymentDueDays ?? 30,
  };
  return api.post(`${BASE_URL}/${id}/issue`, { json: requestBody }).json<ClientInvoice>();
}

/**
 * Record payment on a client invoice
 */
export async function recordClientPayment(
  id: string,
  data: RecordClientPaymentRequest
): Promise<ClientInvoice> {
  return api.post(`${BASE_URL}/${id}/record-payment`, { json: data }).json<ClientInvoice>();
}

/**
 * Cancel a client invoice
 */
export async function cancelClientInvoice(id: string): Promise<ClientInvoice> {
  return api.post(`${BASE_URL}/${id}/cancel`).json<ClientInvoice>();
}

/**
 * Get client invoice PDF
 */
export async function getClientInvoicePdf(id: string): Promise<Blob> {
  return api.get(`${BASE_URL}/${id}/pdf`).blob();
}

/**
 * Get invoice statistics
 */
export async function getClientInvoiceStats(): Promise<ClientInvoiceStats> {
  return api.get(`${BASE_URL}/stats`).json<ClientInvoiceStats>();
}
