import type { UUID } from "./api";

// Common bulk response types matching backend
export type BulkItemStatus = "SUCCESS" | "FAILED" | "SKIPPED";

export interface BulkItemResult {
  itemId: UUID;
  status: BulkItemStatus;
  message: string;
  messageAr: string;
}

export interface BulkOperationSummary {
  totalRequested: number;
  successCount: number;
  failedCount: number;
  skippedCount: number;
  processingTimeMs: number;
}

export interface BulkOperationResponse {
  summary: BulkOperationSummary;
  results: BulkItemResult[];
  timestamp: string;
}

// Member bulk operations
export type BulkMemberAction = "SUSPEND" | "ACTIVATE" | "FREEZE" | "UNFREEZE" | "CANCEL";

export interface BulkMemberStatusRequest {
  memberIds: UUID[];
  action: BulkMemberAction;
  reason?: string;
  sendNotifications?: boolean;
}

export interface BulkMemberDeleteRequest {
  memberIds: UUID[];
  reason?: string;
}

// Subscription bulk operations
export type BulkSubscriptionAction = "FREEZE" | "UNFREEZE" | "CANCEL";

export interface BulkSubscriptionStatusRequest {
  subscriptionIds: UUID[];
  action: BulkSubscriptionAction;
  reason?: string;
  sendNotifications?: boolean;
}

export interface BulkSubscriptionRenewRequest {
  subscriptionIds: UUID[];
  newEndDate?: string;
  paidAmount?: { amount: number; currency: string };
  sendNotifications?: boolean;
}

// Invoice bulk operations
export type BulkInvoiceAction = "ISSUE" | "CANCEL";

export interface BulkInvoiceStatusRequest {
  invoiceIds: UUID[];
  action: BulkInvoiceAction;
  issueDate?: string;
  paymentDueDays?: number;
  sendNotifications?: boolean;
}

export interface BulkPaymentItem {
  invoiceId: UUID;
  amount: { amount: number; currency: string };
  paymentMethod: string;
  reference?: string;
}

export interface BulkRecordPaymentRequest {
  payments: BulkPaymentItem[];
}

// Attendance bulk operations
export interface BulkCheckInRequest {
  memberIds: UUID[];
  locationId: UUID;
  checkInMethod?: string;
  notes?: string;
}

export interface BulkCheckOutRequest {
  memberIds: UUID[];
  notes?: string;
}

// Booking bulk operations
export interface BulkCreateBookingsRequest {
  sessionId: UUID;
  memberIds: UUID[];
  notes?: string;
}

export interface BulkCancelBookingsRequest {
  bookingIds: UUID[];
  reason?: string;
}

// UI state types
export type BulkEntityType = "member" | "subscription" | "invoice" | "attendance" | "booking";

export interface BulkActionConfig {
  entityType: BulkEntityType;
  action: string;
  labelEn: string;
  labelAr: string;
  variant: "default" | "destructive" | "warning";
  requiresReason?: boolean;
  requiresConfirmation?: boolean;
}
