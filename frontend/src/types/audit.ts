import type { UUID } from "./api";

// Matches backend AuditAction enum
export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "STATUS_CHANGE"
  | "LOGIN"
  | "LOGOUT"
  | "PASSWORD_CHANGE"
  | "PASSWORD_RESET"
  | "CHECK_IN"
  | "CHECK_OUT"
  | "BOOKING_CREATE"
  | "BOOKING_CANCEL"
  | "PAYMENT"
  | "INVOICE_ISSUE"
  | "SUBSCRIPTION_ACTIVATE"
  | "SUBSCRIPTION_FREEZE"
  | "SUBSCRIPTION_CANCEL"
  | "SUBSCRIPTION_RENEW"
  | "ACCESS_DENIED"
  | "RATE_LIMITED"
  | "IMPERSONATE_START"
  | "IMPERSONATE_END";

export interface AuditLog {
  id: UUID;
  tenantId?: UUID;
  organizationId?: UUID;
  action: AuditAction;
  entityType: string;
  entityId: UUID;
  userId?: UUID;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  description?: string;
  oldValue?: string; // JSON string
  newValue?: string; // JSON string
  createdAt: string;
}

export interface AuditLogQueryParams {
  entityType?: string;
  entityId?: UUID;
  userId?: UUID;
  action?: AuditAction;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}

// For UI display
export interface AuditLogDisplayItem {
  id: UUID;
  action: AuditAction;
  entityType: string;
  entityId: UUID;
  userEmail?: string;
  description?: string;
  createdAt: string;
  hasChanges: boolean;
}

// Action category for filtering
export type AuditActionCategory =
  | "ALL"
  | "AUTHENTICATION"
  | "MEMBER"
  | "SUBSCRIPTION"
  | "BOOKING"
  | "INVOICE"
  | "SYSTEM";

export const actionCategories: Record<AuditActionCategory, AuditAction[]> = {
  ALL: [],
  AUTHENTICATION: ["LOGIN", "LOGOUT", "PASSWORD_CHANGE", "PASSWORD_RESET", "ACCESS_DENIED"],
  MEMBER: ["CREATE", "UPDATE", "DELETE", "STATUS_CHANGE", "CHECK_IN", "CHECK_OUT"],
  SUBSCRIPTION: ["SUBSCRIPTION_ACTIVATE", "SUBSCRIPTION_FREEZE", "SUBSCRIPTION_CANCEL", "SUBSCRIPTION_RENEW"],
  BOOKING: ["BOOKING_CREATE", "BOOKING_CANCEL"],
  INVOICE: ["INVOICE_ISSUE", "PAYMENT"],
  SYSTEM: ["RATE_LIMITED", "IMPERSONATE_START", "IMPERSONATE_END"],
};
