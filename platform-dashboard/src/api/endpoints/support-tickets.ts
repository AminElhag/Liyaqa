import api from '@/api/client'
import type {
  PageResponse,
  SupportTicket,
  SupportTicketSummary,
  TicketStats,
  TicketMessage,
  CreateTicketRequest,
  UpdateTicketRequest,
  CreateTicketMessageRequest,
  ChangeTicketStatusRequest,
  AssignTicketRequest,
  TicketQueryParams,
} from '@/types'

const BASE_URL = 'api/platform/support-tickets'

/**
 * Create a new support ticket.
 */
export async function createTicket(data: CreateTicketRequest): Promise<SupportTicket> {
  return api.post<SupportTicket>(BASE_URL, data).then((r) => r.data)
}

/**
 * Get support ticket by ID.
 */
export async function getTicket(id: string): Promise<SupportTicket> {
  return api.get<SupportTicket>(`${BASE_URL}/${id}`).then((r) => r.data)
}

/**
 * Get all support tickets with pagination.
 */
export async function getTickets(
  queryParams: TicketQueryParams = {},
): Promise<PageResponse<SupportTicketSummary>> {
  const params: Record<string, string | number> = {}
  if (queryParams.page !== undefined) params.page = queryParams.page
  if (queryParams.size !== undefined) params.size = queryParams.size
  if (queryParams.sortBy) params.sortBy = queryParams.sortBy
  if (queryParams.sortDirection) params.sortDirection = queryParams.sortDirection
  if (queryParams.status) params.status = queryParams.status
  if (queryParams.priority) params.priority = queryParams.priority
  if (queryParams.category) params.category = queryParams.category
  if (queryParams.organizationId) params.organizationId = queryParams.organizationId
  if (queryParams.assignedToId) params.assignedToId = queryParams.assignedToId
  if (queryParams.search) params.search = queryParams.search

  return api
    .get<PageResponse<SupportTicketSummary>>(BASE_URL, { params })
    .then((r) => r.data)
}

/**
 * Get ticket statistics.
 */
export async function getTicketStats(): Promise<TicketStats> {
  return api.get<TicketStats>(`${BASE_URL}/stats`).then((r) => r.data)
}

/**
 * Update a support ticket.
 */
export async function updateTicket(
  id: string,
  data: UpdateTicketRequest,
): Promise<SupportTicket> {
  return api.put<SupportTicket>(`${BASE_URL}/${id}`, data).then((r) => r.data)
}

/**
 * Change ticket status.
 */
export async function changeTicketStatus(
  id: string,
  data: ChangeTicketStatusRequest,
): Promise<SupportTicket> {
  return api
    .post<SupportTicket>(`${BASE_URL}/${id}/status`, data)
    .then((r) => r.data)
}

/**
 * Assign ticket to platform user.
 */
export async function assignTicket(
  id: string,
  data: AssignTicketRequest,
): Promise<SupportTicket> {
  return api
    .post<SupportTicket>(`${BASE_URL}/${id}/assign`, data)
    .then((r) => r.data)
}

/**
 * Get ticket messages.
 */
export async function getTicketMessages(ticketId: string): Promise<TicketMessage[]> {
  return api
    .get<TicketMessage[]>(`${BASE_URL}/${ticketId}/messages`)
    .then((r) => r.data)
}

/**
 * Add message to ticket.
 */
export async function addTicketMessage(
  ticketId: string,
  data: CreateTicketMessageRequest,
): Promise<TicketMessage> {
  return api
    .post<TicketMessage>(`${BASE_URL}/${ticketId}/messages`, data)
    .then((r) => r.data)
}
