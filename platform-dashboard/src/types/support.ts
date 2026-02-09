import type { UUID } from "./api";
import type { MemberStatus, SubscriptionStatus } from "./member";
import type { InvoiceStatus } from "./billing";
import type { UserRole } from "./auth";

// ============================================
// Client Member DTOs
// ============================================

/**
 * Member summary for platform support view.
 */
export interface ClientMemberSummary {
  id: UUID;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: MemberStatus;
  createdAt: string;
  hasActiveSubscription: boolean;
}

/**
 * Detailed member view for platform support.
 */
export interface ClientMemberDetail {
  id: UUID;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  status: MemberStatus;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

// ============================================
// Client Subscription DTOs
// ============================================

/**
 * Member subscription summary for platform support view.
 */
export interface ClientMemberSubscription {
  id: UUID;
  memberId: UUID;
  memberName: string;
  planName: string;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  price?: number;
  currency?: string;
  isFrozen: boolean;
  autoRenew: boolean;
}

// ============================================
// Client Invoice DTOs
// ============================================

/**
 * Member invoice summary for platform support view.
 */
export interface ClientMemberInvoice {
  id: UUID;
  invoiceNumber: string;
  memberId: UUID;
  memberName: string;
  status: InvoiceStatus;
  totalAmount: number;
  paidAmount?: number;
  currency: string;
  issueDate?: string;
  dueDate?: string;
  createdAt: string;
}

// ============================================
// Client User DTOs
// ============================================

/**
 * User summary for platform support view.
 */
export interface ClientUser {
  id: UUID;
  email: string;
  displayNameEn: string;
  displayNameAr?: string;
  role: UserRole;
  status: string;
  memberId?: UUID;
  lastLoginAt?: string;
  createdAt: string;
}

// ============================================
// Impersonation DTOs
// ============================================

/**
 * Request to impersonate a user.
 */
export interface ImpersonateRequest {
  reason: string;
}

/**
 * Response from impersonation.
 */
export interface ImpersonationResponse {
  accessToken: string;
  impersonatedUserId: UUID;
  impersonatedUserEmail: string;
  impersonatedRole: UserRole;
  expiresAt: string;
}

/**
 * Impersonation session info.
 */
export interface ImpersonationSession {
  sessionId: UUID;
  impersonatorId: UUID;
  impersonatorEmail: string;
  impersonatedUserId: UUID;
  impersonatedUserEmail: string;
  reason: string;
  startedAt: string;
  endedAt?: string;
  isActive: boolean;
}

// ============================================
// Support Overview DTOs
// ============================================

/**
 * Overview of a client for support purposes.
 */
export interface ClientSupportOverview {
  organizationId: UUID;
  organizationNameEn: string;
  organizationNameAr?: string;
  totalClubs: number;
  totalLocations: number;
  totalMembers: number;
  activeMembers: number;
  totalUsers: number;
  activeSubscriptions: number;
  outstandingInvoices: number;
  totalRevenueThisMonth: number;
}

// Query params
export interface SupportMemberQueryParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  search?: string;
  status?: MemberStatus;
}

export interface SupportSubscriptionQueryParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  status?: SubscriptionStatus;
}

export interface SupportInvoiceQueryParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  status?: InvoiceStatus;
}

export interface SupportUserQueryParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  role?: UserRole;
}
