import api from '@/api/client'
import type {
  PageResponse,
  ClientInvoice,
  ClientInvoiceSummary,
  ClientInvoiceStats,
  CreateClientInvoiceRequest,
  GenerateFromSubscriptionRequest,
  IssueClientInvoiceRequest,
  RecordClientPaymentRequest,
  UpdateClientInvoiceRequest,
  ClientInvoiceQueryParams,
} from '@/types'

const BASE_URL = 'api/platform/invoices'

/**
 * Create a new client invoice with line items.
 */
export async function createClientInvoice(
  data: CreateClientInvoiceRequest,
): Promise<ClientInvoice> {
  return api.post<ClientInvoice>(BASE_URL, data).then((r) => r.data)
}

/**
 * Generate invoice from subscription.
 */
export async function generateFromSubscription(
  data: GenerateFromSubscriptionRequest,
): Promise<ClientInvoice> {
  return api
    .post<ClientInvoice>(`${BASE_URL}/from-subscription`, data)
    .then((r) => r.data)
}

/**
 * Get client invoice by ID.
 */
export async function getClientInvoice(id: string): Promise<ClientInvoice> {
  return api.get<ClientInvoice>(`${BASE_URL}/${id}`).then((r) => r.data)
}

/**
 * Get all client invoices with pagination.
 */
export async function getClientInvoices(
  queryParams: ClientInvoiceQueryParams = {},
): Promise<PageResponse<ClientInvoiceSummary>> {
  const params: Record<string, string | number> = {}
  if (queryParams.page !== undefined) params.page = queryParams.page
  if (queryParams.size !== undefined) params.size = queryParams.size
  if (queryParams.sortBy) params.sortBy = queryParams.sortBy
  if (queryParams.sortDirection) params.sortDirection = queryParams.sortDirection
  if (queryParams.status) params.status = queryParams.status
  if (queryParams.organizationId) params.organizationId = queryParams.organizationId

  return api
    .get<PageResponse<ClientInvoiceSummary>>(BASE_URL, { params })
    .then((r) => r.data)
}

/**
 * Get invoices by organization.
 */
export async function getInvoicesByOrganization(
  organizationId: string,
  queryParams: ClientInvoiceQueryParams = {},
): Promise<PageResponse<ClientInvoiceSummary>> {
  const params: Record<string, string | number> = {}
  if (queryParams.page !== undefined) params.page = queryParams.page
  if (queryParams.size !== undefined) params.size = queryParams.size

  return api
    .get<PageResponse<ClientInvoiceSummary>>(
      `${BASE_URL}/organization/${organizationId}`,
      { params },
    )
    .then((r) => r.data)
}

/**
 * Update a client invoice.
 */
export async function updateClientInvoice(
  id: string,
  data: UpdateClientInvoiceRequest,
): Promise<ClientInvoice> {
  return api.put<ClientInvoice>(`${BASE_URL}/${id}`, data).then((r) => r.data)
}

/**
 * Issue a client invoice.
 */
export async function issueClientInvoice(
  id: string,
  data: IssueClientInvoiceRequest = {},
): Promise<ClientInvoice> {
  const requestBody = {
    issueDate: data.issueDate || new Date().toISOString().split('T')[0],
    paymentDueDays: data.paymentDueDays ?? 30,
  }
  return api
    .post<ClientInvoice>(`${BASE_URL}/${id}/issue`, requestBody)
    .then((r) => r.data)
}

/**
 * Record payment on a client invoice.
 */
export async function recordClientPayment(
  id: string,
  data: RecordClientPaymentRequest,
): Promise<ClientInvoice> {
  return api
    .post<ClientInvoice>(`${BASE_URL}/${id}/record-payment`, data)
    .then((r) => r.data)
}

/**
 * Cancel a client invoice.
 */
export async function cancelClientInvoice(id: string): Promise<ClientInvoice> {
  return api.post<ClientInvoice>(`${BASE_URL}/${id}/cancel`).then((r) => r.data)
}

/**
 * Get client invoice PDF.
 */
export async function getClientInvoicePdf(id: string): Promise<Blob> {
  return api
    .get<Blob>(`${BASE_URL}/${id}/pdf`, { responseType: 'blob' })
    .then((r) => r.data)
}

/**
 * Get invoice statistics.
 */
export async function getClientInvoiceStats(): Promise<ClientInvoiceStats> {
  return api.get<ClientInvoiceStats>(`${BASE_URL}/stats`).then((r) => r.data)
}
