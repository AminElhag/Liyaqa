import { api } from "../client";
import type { PageResponse } from "../../../types/api";
import type {
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
} from "../../../types/platform/support-ticket";

const BASE_URL = "api/platform/support-tickets";

// Flag to use mock data (backend not implemented yet)
const USE_MOCK = false;

// ============================================
// Mock Data
// ============================================

function getMockTickets(): SupportTicketSummary[] {
  return [
    {
      id: "ticket-001",
      ticketNumber: "TKT-2026-0001",
      organizationId: "org-001",
      organizationName: { en: "Fitness First", ar: "فتنس فيرست" },
      subject: "Cannot generate invoices",
      category: "BILLING",
      status: "OPEN",
      priority: "HIGH",
      assignedToName: undefined,
      messageCount: 2,
      lastMessageAt: new Date(Date.now() - 3600000).toISOString(),
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "ticket-002",
      ticketNumber: "TKT-2026-0002",
      organizationId: "org-002",
      organizationName: { en: "Gold's Gym", ar: "جولدز جيم" },
      subject: "Login issues for staff members",
      category: "TECHNICAL",
      status: "IN_PROGRESS",
      priority: "URGENT",
      assignedToName: "Ahmed Hassan",
      messageCount: 5,
      lastMessageAt: new Date(Date.now() - 1800000).toISOString(),
      createdAt: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      id: "ticket-003",
      ticketNumber: "TKT-2026-0003",
      organizationId: "org-003",
      organizationName: { en: "Anytime Fitness", ar: "إني تايم فتنس" },
      subject: "Request for bulk member import feature",
      category: "FEATURE_REQUEST",
      status: "WAITING_ON_CLIENT",
      priority: "MEDIUM",
      assignedToName: "Sara Ali",
      messageCount: 3,
      lastMessageAt: new Date(Date.now() - 7200000).toISOString(),
      createdAt: new Date(Date.now() - 259200000).toISOString(),
    },
    {
      id: "ticket-004",
      ticketNumber: "TKT-2026-0004",
      organizationId: "org-001",
      organizationName: { en: "Fitness First", ar: "فتنس فيرست" },
      subject: "Subscription renewal not working",
      category: "BILLING",
      status: "RESOLVED",
      priority: "HIGH",
      assignedToName: "Ahmed Hassan",
      messageCount: 8,
      lastMessageAt: new Date(Date.now() - 14400000).toISOString(),
      createdAt: new Date(Date.now() - 432000000).toISOString(),
    },
    {
      id: "ticket-005",
      ticketNumber: "TKT-2026-0005",
      organizationId: "org-004",
      organizationName: { en: "Planet Fitness", ar: "بلانت فتنس" },
      subject: "How to set up class schedules?",
      category: "GENERAL",
      status: "CLOSED",
      priority: "LOW",
      assignedToName: "Mohammed Khalid",
      messageCount: 4,
      lastMessageAt: new Date(Date.now() - 604800000).toISOString(),
      createdAt: new Date(Date.now() - 864000000).toISOString(),
    },
  ];
}

function getMockTicket(id: string): SupportTicket {
  const tickets = getMockTickets();
  const summary = tickets.find((t) => t.id === id) || tickets[0];

  return {
    ...summary,
    description:
      "This is a detailed description of the issue. The client is experiencing problems with the system and needs assistance.",
    clubId: undefined,
    clubName: undefined,
    assignedToId: summary.assignedToName ? "user-001" : undefined,
    createdById: "user-client-001",
    createdByName: "John Smith",
    createdByEmail: "john@example.com",
    isInternal: false,
    tags: ["billing", "urgent"],
    resolvedAt: summary.status === "RESOLVED" ? new Date().toISOString() : undefined,
    closedAt: summary.status === "CLOSED" ? new Date().toISOString() : undefined,
    updatedAt: summary.lastMessageAt || summary.createdAt,
  };
}

function getMockStats(): TicketStats {
  return {
    total: 47,
    open: 12,
    inProgress: 8,
    waitingOnClient: 5,
    resolved: 15,
    closed: 7,
    avgResolutionTimeHours: 24,
    ticketsResolvedToday: 3,
  };
}

function getMockMessages(ticketId: string): TicketMessage[] {
  return [
    {
      id: "msg-001",
      ticketId,
      content:
        "Hello, I am having trouble generating invoices for my members. The system shows an error when I click the generate button.",
      authorId: "user-client-001",
      authorName: "John Smith",
      authorEmail: "john@example.com",
      isFromClient: true,
      isInternal: false,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "msg-002",
      ticketId,
      content:
        "Thank you for reaching out. Can you please provide more details about the error message you are seeing?",
      authorId: "user-001",
      authorName: "Ahmed Hassan",
      authorEmail: "ahmed@liyaqa.com",
      isFromClient: false,
      isInternal: false,
      createdAt: new Date(Date.now() - 82800000).toISOString(),
    },
    {
      id: "msg-003",
      ticketId,
      content: "Internal note: Check if their subscription allows invoice generation.",
      authorId: "user-001",
      authorName: "Ahmed Hassan",
      authorEmail: "ahmed@liyaqa.com",
      isFromClient: false,
      isInternal: true,
      createdAt: new Date(Date.now() - 79200000).toISOString(),
    },
  ];
}

// ============================================
// API Functions
// ============================================

/**
 * Create a new support ticket
 */
export async function createTicket(data: CreateTicketRequest): Promise<SupportTicket> {
  if (USE_MOCK) {
    throw new Error("Backend not implemented - mock mode");
  }
  return api.post(BASE_URL, { json: data }).json<SupportTicket>();
}

/**
 * Get support ticket by ID
 */
export async function getTicket(id: string): Promise<SupportTicket> {
  if (USE_MOCK) {
    return getMockTicket(id);
  }
  return api.get(`${BASE_URL}/${id}`).json<SupportTicket>();
}

/**
 * Get all support tickets with pagination
 */
export async function getTickets(
  params: TicketQueryParams = {}
): Promise<PageResponse<SupportTicketSummary>> {
  if (USE_MOCK) {
    let mockTickets = getMockTickets();

    // Apply filters
    if (params.status) {
      mockTickets = mockTickets.filter((t) => t.status === params.status);
    }
    if (params.priority) {
      mockTickets = mockTickets.filter((t) => t.priority === params.priority);
    }
    if (params.category) {
      mockTickets = mockTickets.filter((t) => t.category === params.category);
    }
    if (params.search) {
      const search = params.search.toLowerCase();
      mockTickets = mockTickets.filter(
        (t) =>
          t.subject.toLowerCase().includes(search) ||
          t.ticketNumber.toLowerCase().includes(search)
      );
    }

    return {
      content: mockTickets,
      totalElements: mockTickets.length,
      totalPages: 1,
      size: params.size || 10,
      number: params.page || 0,
      pageable: {
        pageNumber: params.page || 0,
        pageSize: params.size || 10,
        sort: { sorted: false, unsorted: true, empty: true },
        offset: 0,
        paged: true,
        unpaged: false,
      },
      last: true,
      first: true,
      numberOfElements: mockTickets.length,
      empty: mockTickets.length === 0,
    };
  }

  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortDirection) searchParams.set("sortDirection", params.sortDirection);
  if (params.status) searchParams.set("status", params.status);
  if (params.priority) searchParams.set("priority", params.priority);
  if (params.category) searchParams.set("category", params.category);
  if (params.organizationId) searchParams.set("organizationId", params.organizationId);
  if (params.assignedToId) searchParams.set("assignedToId", params.assignedToId);
  if (params.search) searchParams.set("search", params.search);

  return api.get(BASE_URL, { searchParams }).json<PageResponse<SupportTicketSummary>>();
}

/**
 * Get ticket statistics
 */
export async function getTicketStats(): Promise<TicketStats> {
  if (USE_MOCK) {
    return getMockStats();
  }
  return api.get(`${BASE_URL}/stats`).json<TicketStats>();
}

/**
 * Update a support ticket
 */
export async function updateTicket(
  id: string,
  data: UpdateTicketRequest
): Promise<SupportTicket> {
  if (USE_MOCK) {
    throw new Error("Backend not implemented - mock mode");
  }
  return api.put(`${BASE_URL}/${id}`, { json: data }).json<SupportTicket>();
}

/**
 * Change ticket status
 */
export async function changeTicketStatus(
  id: string,
  data: ChangeTicketStatusRequest
): Promise<SupportTicket> {
  if (USE_MOCK) {
    throw new Error("Backend not implemented - mock mode");
  }
  return api.post(`${BASE_URL}/${id}/status`, { json: data }).json<SupportTicket>();
}

/**
 * Assign ticket to platform user
 */
export async function assignTicket(
  id: string,
  data: AssignTicketRequest
): Promise<SupportTicket> {
  if (USE_MOCK) {
    throw new Error("Backend not implemented - mock mode");
  }
  return api.post(`${BASE_URL}/${id}/assign`, { json: data }).json<SupportTicket>();
}

/**
 * Get ticket messages
 */
export async function getTicketMessages(ticketId: string): Promise<TicketMessage[]> {
  if (USE_MOCK) {
    return getMockMessages(ticketId);
  }
  return api.get(`${BASE_URL}/${ticketId}/messages`).json<TicketMessage[]>();
}

/**
 * Add message to ticket
 */
export async function addTicketMessage(
  ticketId: string,
  data: CreateTicketMessageRequest
): Promise<TicketMessage> {
  if (USE_MOCK) {
    throw new Error("Backend not implemented - mock mode");
  }
  return api
    .post(`${BASE_URL}/${ticketId}/messages`, { json: data })
    .json<TicketMessage>();
}
