import type { UUID, LocalizedText } from "../api";

// ============================================
// Enums
// ============================================

/**
 * Status of a support ticket.
 */
export type TicketStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "WAITING_ON_CLIENT"
  | "RESOLVED"
  | "CLOSED";

/**
 * Priority level of a support ticket.
 */
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

/**
 * Category of a support ticket.
 */
export type TicketCategory =
  | "BILLING"
  | "TECHNICAL"
  | "ACCOUNT"
  | "FEATURE_REQUEST"
  | "BUG_REPORT"
  | "GENERAL";

// ============================================
// Core DTOs
// ============================================

/**
 * Full support ticket response.
 */
export interface SupportTicket {
  id: UUID;
  ticketNumber: string;
  organizationId: UUID;
  organizationName?: LocalizedText;
  clubId?: UUID;
  clubName?: LocalizedText;

  // Ticket content
  subject: string;
  description: string;
  category: TicketCategory;
  status: TicketStatus;
  priority: TicketPriority;

  // Assignment
  assignedToId?: UUID;
  assignedToName?: string;
  createdById: UUID;
  createdByName?: string;
  createdByEmail?: string;

  // Metadata
  isInternal: boolean;
  tags?: string[];

  // Stats
  messageCount: number;
  lastMessageAt?: string;
  resolvedAt?: string;
  closedAt?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Simplified ticket for list views.
 */
export interface SupportTicketSummary {
  id: UUID;
  ticketNumber: string;
  organizationId: UUID;
  organizationName?: LocalizedText;
  subject: string;
  category: TicketCategory;
  status: TicketStatus;
  priority: TicketPriority;
  assignedToName?: string;
  messageCount: number;
  lastMessageAt?: string;
  createdAt: string;
}

/**
 * Ticket statistics.
 */
export interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  waitingOnClient: number;
  resolved: number;
  closed: number;
  avgResolutionTimeHours?: number;
  ticketsResolvedToday?: number;
}

// ============================================
// Message DTOs
// ============================================

/**
 * A message in a ticket thread.
 */
export interface TicketMessage {
  id: UUID;
  ticketId: UUID;
  content: string;

  // Author info
  authorId: UUID;
  authorName: string;
  authorEmail: string;
  isFromClient: boolean;

  // Attachments
  attachments?: TicketAttachment[];

  // Metadata
  isInternal: boolean;

  createdAt: string;
}

/**
 * File attachment on a ticket message.
 */
export interface TicketAttachment {
  id: UUID;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
}

// ============================================
// Request Types
// ============================================

export interface CreateTicketRequest {
  organizationId: UUID;
  clubId?: UUID;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  assignedToId?: UUID;
  isInternal?: boolean;
  tags?: string[];
}

export interface UpdateTicketRequest {
  subject?: string;
  description?: string;
  category?: TicketCategory;
  priority?: TicketPriority;
  assignedToId?: UUID;
  tags?: string[];
}

export interface CreateTicketMessageRequest {
  content: string;
  isInternal?: boolean;
}

export interface ChangeTicketStatusRequest {
  status: TicketStatus;
  resolution?: string;
}

export interface AssignTicketRequest {
  assignedToId: UUID;
}

// ============================================
// Query Params
// ============================================

export interface TicketQueryParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  organizationId?: UUID;
  assignedToId?: UUID;
  search?: string;
}
